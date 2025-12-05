import type {
  AgentRun,
  StageExecution,
  LuminaResult,
  QueryProcessingOutput,
  LessonPlanningOutput,
  ScriptGenerationOutput,
  AnimationSynthesisOutput,
  OptimizationOutput,
  OrchestratorConfig,
} from "@/types/lumina"
import { getGeminiClient } from "./GeminiClient"
import { getManimRenderer } from "./ManimRenderer"
import { getVideoCacheService } from "./VideoCacheService"

/**
 * LuminaOrchestrator
 * 
 * Manages the lifecycle of Lumina agent runs:
 * - Creates and tracks runs
 * - Executes pipeline stages sequentially
 * - Streams events to clients via SSE
 * - Integrates with Xera Animate for Manim rendering
 */
export class LuminaOrchestrator {
  private config: OrchestratorConfig
  private activeRuns: Map<string, AgentRun> = new Map()

  constructor(config: OrchestratorConfig) {
    this.config = config
  }

  /**
   * Create a new agent run
   */
  async createRun(
    userId: string,
    query: string,
    mode: AgentRun["mode"],
    context?: AgentRun["context"]
  ): Promise<AgentRun> {
    const run: AgentRun = {
      id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId,
      query,
      mode,
      context,
      status: "pending",
      stages: [
        { stage: "query_processing", status: "pending" },
        { stage: "lesson_planning", status: "pending" },
        { stage: "script_generation", status: "pending" },
        { stage: "animation_synthesis", status: "pending" },
        { stage: "optimization", status: "pending" },
      ],
      createdAt: new Date(),
    }

    this.activeRuns.set(run.id, run)
    return run
  }

  /**
   * Resume a failed run from the last completed stage
   */
  async resumeRun(runId: string): Promise<AgentRun> {
    const run = this.activeRuns.get(runId)
    if (!run) {
      throw new Error(`Run ${runId} not found`)
    }

    if (run.status === "completed") {
      throw new Error(`Run ${runId} is already completed`)
    }

    // Reset failed status
    run.status = "processing"
    
    return run
  }

  /**
   * Execute all stages of a run and yield events
   */
  async *executeRun(runId: string, resumeFrom?: string): AsyncGenerator<any> {
    const run = this.activeRuns.get(runId)
    if (!run) {
      throw new Error(`Run ${runId} not found`)
    }

    run.status = "processing"
    yield { type: "run_created", runId: run.id }

    // Store retry events to yield after async operations
    const retryEvents: Array<{ stage: string; attempt: number; delay: number }> = []

    // Determine starting stage (for resume functionality)
    const stageOrder = ["query_processing", "lesson_planning", "script_generation", "animation_synthesis", "optimization"]
    const startIdx = resumeFrom ? stageOrder.indexOf(resumeFrom) : 0
    
    // Gather outputs from completed stages
    let queryOutput = run.stages.find(s => s.stage === "query_processing" && s.status === "completed")?.output
    let lessonOutput = run.stages.find(s => s.stage === "lesson_planning" && s.status === "completed")?.output
    let scriptOutput = run.stages.find(s => s.stage === "script_generation" && s.status === "completed")?.output

    try {
      // Stage 1: Query Processing
      if (startIdx <= 0) {
        yield { type: "stage", stage: "query_processing" }
        queryOutput = await this.executeQueryProcessing(run, (stage: string, attempt: number, delay: number) => {
          retryEvents.push({ stage, attempt, delay })
        })
        for (const retryEvent of retryEvents.splice(0, retryEvents.length)) {
          yield { type: "retry", stage: retryEvent.stage, attempt: retryEvent.attempt, delay: retryEvent.delay }
        }
        yield { type: "stage_output", stage: "query_processing", output: queryOutput }
      } else if (queryOutput) {
        yield { type: "stage", stage: "query_processing", status: "skipped" }
      }

      // Stage 2: Lesson Planning
      if (startIdx <= 1 && queryOutput) {
        yield { type: "stage", stage: "lesson_planning" }
        lessonOutput = await this.executeLessonPlanning(run, queryOutput, (stage: string, attempt: number, delay: number) => {
          retryEvents.push({ stage, attempt, delay })
        })
        for (const retryEvent of retryEvents.splice(0, retryEvents.length)) {
          yield { type: "retry", stage: retryEvent.stage, attempt: retryEvent.attempt, delay: retryEvent.delay }
        }
        yield { type: "stage_output", stage: "lesson_planning", output: lessonOutput }
      } else if (lessonOutput) {
        yield { type: "stage", stage: "lesson_planning", status: "skipped" }
      }

      // Stream narrative steps as tokens
      if (lessonOutput) {
        for (const step of lessonOutput.narrative.steps) {
          yield { type: "token", content: step.explanation }
        }
      }

      // Stage 3: Script Generation
      if (startIdx <= 2 && lessonOutput && queryOutput) {
        yield { type: "stage", stage: "script_generation" }
        scriptOutput = await this.executeScriptGeneration(run, lessonOutput, (stage: string, attempt: number, delay: number) => {
          retryEvents.push({ stage, attempt, delay })
        })
        for (const retryEvent of retryEvents.splice(0, retryEvents.length)) {
          yield { type: "retry", stage: retryEvent.stage, attempt: retryEvent.attempt, delay: retryEvent.delay }
        }
        yield { type: "stage_output", stage: "script_generation", output: scriptOutput }
      } else if (scriptOutput) {
        yield { type: "stage", stage: "script_generation", status: "skipped" }
      }

      // Stage 4: Animation Synthesis
      let animationOutput
      if (startIdx <= 3 && scriptOutput) {
        yield { type: "stage", stage: "animation_synthesis" }
        animationOutput = await this.executeAnimationSynthesis(run, scriptOutput)
        
        if (animationOutput.visual_plan) {
          yield {
            type: "visual-plan",
            scene: animationOutput.visual_plan.scene,
            spec: animationOutput.visual_plan.spec,
          }
        }
      } else {
        animationOutput = run.stages.find(s => s.stage === "animation_synthesis" && s.status === "completed")?.output
        if (animationOutput) {
          yield { type: "stage", stage: "animation_synthesis", status: "skipped" }
        }
      }

      // Stage 5: Optimization
      if (startIdx <= 4 && animationOutput) {
        yield { type: "stage", stage: "optimization" }
        const optimizationOutput = await this.executeOptimization(run, animationOutput)

        // Final result
        run.result = {
          answer: optimizationOutput.optimized_answer,
          visualPlan: animationOutput.visual_plan,
          videoUrl: optimizationOutput.video_url,
          thumbnailUrl: optimizationOutput.thumbnail_url,
        }
        run.status = "completed"
        run.completedAt = new Date()

        yield {
          type: "done",
          runId: run.id,
          video_url: optimizationOutput.video_url,
          result: run.result,
        }
      }
    } catch (error) {
      run.status = "failed"
      run.completedAt = new Date()
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("[LuminaOrchestrator] Pipeline error:", error)
      yield { type: "error", error: errorMessage }
      yield { type: "done" }
    }
  }

  /**
   * Stage 1: Query Processing
   * Parse user intent and extract concepts
   */
  private async executeQueryProcessing(
    run: AgentRun,
    onRetry?: (stage: string, attempt: number, delay: number) => void
  ): Promise<QueryProcessingOutput> {
    const stage = run.stages.find((s) => s.stage === "query_processing")
    if (!stage) throw new Error("Stage not found")

    stage.status = "active"
    stage.startedAt = new Date()

    try {
      const gemini = getGeminiClient(onRetry)
      const output = await gemini.processQuery(run.query, run.mode)

      stage.status = "completed"
      stage.completedAt = new Date()
      stage.output = output

      return output
    } catch (error) {
      stage.status = "failed"
      stage.error = error instanceof Error ? error.message : "Unknown error"
      throw error
    }
  }

  /**
   * Stage 2: Lesson Planning
   * Design narrative and visual strategy
   */
  private async executeLessonPlanning(
    run: AgentRun,
    queryOutput: QueryProcessingOutput,
    onRetry?: (stage: string, attempt: number, delay: number) => void
  ): Promise<LessonPlanningOutput> {
    const stage = run.stages.find((s) => s.stage === "lesson_planning")
    if (!stage) throw new Error("Stage not found")

    stage.status = "active"
    stage.startedAt = new Date()

    try {
      const gemini = getGeminiClient(onRetry)
      const output = await gemini.planLesson(run.query, queryOutput)

      stage.status = "completed"
      stage.completedAt = new Date()
      stage.output = output

      return output
    } catch (error) {
      stage.status = "failed"
      stage.error = error instanceof Error ? error.message : "Unknown error"
      throw error
    }
  }

  /**
   * Stage 3: Script Generation
   * Generate Manim specification
   */
  private async executeScriptGeneration(
    run: AgentRun,
    lessonOutput: LessonPlanningOutput,
    onRetry?: (stage: string, attempt: number, delay: number) => void
  ): Promise<ScriptGenerationOutput> {
    const stage = run.stages.find((s) => s.stage === "script_generation")
    if (!stage) throw new Error("Stage not found")

    stage.status = "active"
    stage.startedAt = new Date()

    try {
      const gemini = getGeminiClient(onRetry)
      const queryOutput = run.stages.find((s) => s.stage === "query_processing")?.output as QueryProcessingOutput
      const output = await gemini.generateScript(run.query, lessonOutput, queryOutput)

      stage.status = "completed"
      stage.completedAt = new Date()
      stage.output = output

      return output
    } catch (error) {
      stage.status = "failed"
      stage.error = error instanceof Error ? error.message : "Unknown error"
      throw error
    }
  }

  /**
   * Stage 4: Animation Synthesis
   * Execute Manim directly with local renderer
   */
  private async executeAnimationSynthesis(
    run: AgentRun,
    scriptOutput: ScriptGenerationOutput
  ): Promise<AnimationSynthesisOutput> {
    const stage = run.stages.find((s) => s.stage === "animation_synthesis")
    if (!stage) throw new Error("Stage not found")

    stage.status = "active"
    stage.startedAt = new Date()
    const startTime = Date.now()

    try {
      const manimRenderer = getManimRenderer()
      const cacheService = getVideoCacheService()
      
      // Check if Manim is installed
      const manimInstalled = await manimRenderer.checkManimInstalled()
      
      if (!manimInstalled) {
        console.log("[LuminaOrchestrator] Manim not installed, using fallback visual plan")
        const output: AnimationSynthesisOutput = {
          visual_plan: {
            scene: scriptOutput.manim_spec.concept,
            spec: {
              concept: scriptOutput.manim_spec.concept,
              parameters: scriptOutput.manim_spec.parameters,
            },
          },
          status: "fallback",
          execution_time: Date.now() - startTime,
        }
        
        stage.status = "completed"
        stage.completedAt = new Date()
        stage.output = output
        return output
      }

      // Attempt Manim rendering with caching
      try {
        const videoUrl = await cacheService.getOrRenderVideo(
          scriptOutput.manim_spec,
          async () => {
            const { videoPath } = await manimRenderer.render(scriptOutput.manim_spec)
            return { url: videoPath }
          }
        )
        
        const output: AnimationSynthesisOutput = {
          video_url: videoUrl,
          visual_plan: {
            scene: scriptOutput.manim_spec.concept,
            spec: {
              concept: scriptOutput.manim_spec.concept,
              parameters: scriptOutput.manim_spec.parameters,
            },
          },
          status: "success",
          execution_time: Date.now() - startTime,
        }

        stage.status = "completed"
        stage.completedAt = new Date()
        stage.output = output

        return output
      } catch (renderError) {
        console.error("[LuminaOrchestrator] Manim rendering failed, using fallback:", renderError)
        
        // Fallback on error
        const output: AnimationSynthesisOutput = {
          visual_plan: {
            scene: scriptOutput.manim_spec.concept,
            spec: {
              concept: scriptOutput.manim_spec.concept,
              parameters: scriptOutput.manim_spec.parameters,
            },
          },
          status: "fallback",
          execution_time: Date.now() - startTime,
          error: renderError instanceof Error ? renderError.message : "Rendering failed",
        }
        
        stage.status = "completed"
        stage.completedAt = new Date()
        stage.output = output
        return output
      }
    } catch (error) {
      stage.status = "failed"
      stage.error = error instanceof Error ? error.message : "Unknown error"
      throw error
    }
  }

  /**
   * Stage 5: Optimization
   * Refine answer and compress assets
   */
  private async executeOptimization(
    run: AgentRun,
    animationOutput: AnimationSynthesisOutput
  ): Promise<OptimizationOutput> {
    const stage = run.stages.find((s) => s.stage === "optimization")
    if (!stage) throw new Error("Stage not found")

    stage.status = "active"
    stage.startedAt = new Date()

    try {
      // Collect all explanation text from lesson plan
      const lessonStage = run.stages.find((s) => s.stage === "lesson_planning")
      const lessonOutput = lessonStage?.output as LessonPlanningOutput | undefined

      const answer = lessonOutput
        ? lessonOutput.narrative.steps.map((s) => s.explanation).join(" ")
        : "Explanation generated."

      const output: OptimizationOutput = {
        optimized_answer: answer,
        video_url: animationOutput.video_url,
        thumbnail_url: undefined,
        cache_key: undefined,
      }

      stage.status = "completed"
      stage.completedAt = new Date()
      stage.output = output

      return output
    } catch (error) {
      stage.status = "failed"
      stage.error = error instanceof Error ? error.message : "Unknown error"
      throw error
    }
  }

  /**
   * Helper: Extract concepts from query (simple keyword extraction)
   */
  private extractConcepts(query: string): string[] {
    const keywords = [
      "projectile motion",
      "acceleration",
      "velocity",
      "force",
      "energy",
      "momentum",
      "wave",
      "derivative",
      "integral",
      "limit",
      "vector",
      "matrix",
    ]

    return keywords.filter((keyword) =>
      query.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  /**
   * Get run by ID
   */
  getRun(runId: string): AgentRun | undefined {
    return this.activeRuns.get(runId)
  }

  /**
   * Cleanup completed runs older than TTL
   */
  cleanup(ttlMs: number = 3600000) {
    const now = Date.now()
    for (const [id, run] of this.activeRuns.entries()) {
      if (
        run.status === "completed" &&
        run.completedAt &&
        now - run.completedAt.getTime() > ttlMs
      ) {
        this.activeRuns.delete(id)
      }
    }
  }
}

// Singleton instance
let orchestrator: LuminaOrchestrator | null = null

export function getLuminaOrchestrator(): LuminaOrchestrator {
  if (!orchestrator) {
    orchestrator = new LuminaOrchestrator({
      modelProvider: (process.env.LUMINA_MODEL_PROVIDER as any) || "anthropic",
      modelName: process.env.LUMINA_MODEL_NAME || "claude-sonnet-4",
      xeraEndpoint: process.env.XERA_AGENT_ENDPOINT,
      xeraTimeout: parseInt(process.env.XERA_AGENT_TIMEOUT_MS || "60000", 10),
      cacheEnabled: process.env.LUMINA_CACHE_ENABLED === "true",
      cacheTtl: parseInt(process.env.LUMINA_CACHE_TTL_SEC || "604800", 10),
    })
  }
  return orchestrator
}
