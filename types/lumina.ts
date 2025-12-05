// Core types for Lumina agent runs
export interface AgentRun {
  id: string
  userId: string
  query: string
  mode: "explain" | "what-if" | "check"
  context?: {
    courseId?: string
    unitId?: string
    history?: Message[]
  }
  status: "pending" | "processing" | "completed" | "failed"
  stages: StageExecution[]
  result?: LuminaResult
  createdAt: Date
  completedAt?: Date
}

export interface Message {
  role: "user" | "assistant"
  content: string
}

export interface StageExecution {
  stage: "query_processing" | "lesson_planning" | "script_generation" | "animation_synthesis" | "optimization"
  status: "pending" | "active" | "completed" | "failed"
  startedAt?: Date
  completedAt?: Date
  output?: any
  error?: string
}

export interface LuminaResult {
  answer: string
  visualPlan?: VisualPlan
  videoUrl?: string
  thumbnailUrl?: string
}

export interface VisualPlan {
  scene: string
  spec: {
    concept: string
    parameters: Record<string, any>
  }
}

// Stage outputs

export interface QueryProcessingOutput {
  concepts: string[]
  audience: string
  goal: string
  tone: string
  prerequisites: string[]
}

export interface LessonPlanningOutput {
  narrative: {
    hook: string
    steps: Array<{
      title: string
      explanation: string
      visual_cue: string
    }>
    conclusion: string
  }
  visual_strategy: {
    scenes: Array<{
      id: string
      description: string
      duration: number
    }>
  }
}

export interface ScriptGenerationOutput {
  manim_spec: {
    concept: string
    scenes: Array<{
      id: string
      objects: Array<{
        type: string
        params: Record<string, any>
      }>
      animations: Array<{
        type: string
        target: string
        duration: number
        easing: string
      }>
      text_overlay?: string
    }>
    parameters: Record<string, number>
  }
}

export interface AnimationSynthesisOutput {
  video_url?: string
  visual_plan: VisualPlan
  status: "success" | "fallback" | "failed"
  execution_time: number
  error?: string
}

export interface OptimizationOutput {
  optimized_answer: string
  video_url?: string
  thumbnail_url?: string
  cache_key?: string
}

// Xera Animate integration types

export interface XeraAnimateRequest {
  manim_spec: ScriptGenerationOutput["manim_spec"]
  quality: "low_quality" | "medium_quality" | "high_quality"
  output_format?: "mp4" | "mov" | "webm"
}

export interface XeraAnimateResponse {
  jobId: string
  status: "queued" | "processing" | "completed" | "failed"
  video_url?: string
  error?: string
  execution_time?: number
}

// Orchestrator types

export type StageHandler = (
  run: AgentRun,
  previousOutput?: any
) => Promise<{ output: any; tokens?: string[] }>

export interface OrchestratorConfig {
  modelProvider: "openai" | "anthropic"
  modelName: string
  xeraEndpoint?: string
  xeraTimeout: number
  cacheEnabled: boolean
  cacheTtl: number
}
