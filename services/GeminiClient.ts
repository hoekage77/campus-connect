import { generateObject, generateText } from "ai"
import { google } from "@ai-sdk/google"
import type {
  QueryProcessingOutput,
  LessonPlanningOutput,
  ScriptGenerationOutput,
} from "@/types/lumina"
import { z } from "zod"

/**
 * GeminiClient
 * 
 * Wraps Google Gemini 2.0 Flash API (via Vercel AI SDK) for Lumina pipeline stages
 * Includes retry logic with exponential backoff for rate limits
 * Uses @ai-sdk/google for unified provider interface
 */
export class GeminiClient {
  private modelName: string
  private maxRetries = 3
  private baseDelay = 1000 // 1 second
  private onRetry?: (stage: string, attempt: number, delay: number) => void

  constructor(
    apiKey: string, 
    modelName: string = "gemini-2.0-flash-exp",
    onRetry?: (stage: string, attempt: number, delay: number) => void
  ) {
    // Vercel AI SDK uses process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && apiKey) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey
    }
    
    this.modelName = modelName
    this.onRetry = onRetry
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error: any) {
        lastError = error
        
        // Check if it's a rate limit error (429)
        const isRateLimit = error.status === 429 || 
                           error.message?.includes("quota") ||
                           error.message?.includes("Too Many Requests")
        
        if (isRateLimit && attempt < this.maxRetries - 1) {
          // Extract retry delay from error if available
          let retryAfter = this.baseDelay * Math.pow(2, attempt) // Exponential backoff
          
          // Try to parse the "Please retry in X" from error message
          const retryMatch = error.message?.match(/retry in ([\d.]+)s/)
          if (retryMatch) {
            retryAfter = Math.ceil(parseFloat(retryMatch[1]) * 1000)
          }
          
          console.log(`[Gemini] ${context} - Rate limit hit, retrying in ${retryAfter}ms (attempt ${attempt + 1}/${this.maxRetries})`)
          
          // Notify callback if provided
          if (this.onRetry) {
            this.onRetry(context, attempt + 1, retryAfter)
          }
          
          await new Promise(resolve => setTimeout(resolve, retryAfter))
          continue
        }
        
        // Non-retryable error or max retries reached
        throw error
      }
    }
    
    throw lastError
  }

  /**
   * Stage 1: Query Processing
   * Extract concepts, audience, goal, tone from user query
   */
  async processQuery(query: string, mode: string): Promise<QueryProcessingOutput> {
    const schema = z.object({
      concepts: z.array(z.string()).describe("Array of mathematical/scientific concepts"),
      audience: z.enum(["middle_school", "high_school", "undergraduate", "graduate"]).describe("Education level"),
      goal: z.string().describe("One-sentence pedagogical goal"),
      tone: z.enum(["exploratory", "formal", "enthusiastic"]).describe("Communication style"),
      prerequisites: z.array(z.string()).describe("Array of prerequisite concepts"),
    })

    return await this.retryWithBackoff(async () => {
      const { object } = await generateObject({
        model: google(this.modelName),
        schema,
        prompt: `You are a STEM tutoring assistant analyzing student questions.

Student query: "${query}"
Mode: ${mode}

Analyze this query and extract:
1. Concepts: array of mathematical/scientific concepts involved
2. Audience: education level
3. Goal: one-sentence pedagogical goal
4. Tone: communication style
5. Prerequisites: array of prerequisite concepts`,
      })
      return object as QueryProcessingOutput
    }, "Query Processing")
  }

  /**
   * Stage 2: Lesson Planning
   * Design narrative structure and visual strategy
   */
  async planLesson(
    query: string,
    queryOutput: QueryProcessingOutput
  ): Promise<LessonPlanningOutput> {
    const schema = z.object({
      narrative: z.object({
        hook: z.string().describe("Curiosity-inducing question or statement"),
        steps: z.array(z.object({
          title: z.string(),
          explanation: z.string(),
          visual_cue: z.string(),
        })).describe("3-5 step lesson narrative"),
        conclusion: z.string().describe("Satisfying 'aha!' moment summary"),
      }),
      visual_strategy: z.object({
        scenes: z.array(z.object({
          id: z.string(),
          description: z.string(),
          duration: z.number(),
        })).describe("Scenes to be animated"),
      }),
    })

    return await this.retryWithBackoff(async () => {
      const { object } = await generateObject({
        model: google(this.modelName),
        schema,
        prompt: `You are a mathematical educator inspired by 3Blue1Brown, designing a visual lesson.

Student query: "${query}"
Concepts: ${queryOutput.concepts.join(", ")}
Goal: ${queryOutput.goal}
Audience: ${queryOutput.audience}
Tone: ${queryOutput.tone}

Design a 3-5 step lesson narrative where each step:
- Builds intuition before formulas
- Uses visual metaphors and geometric reasoning
- Leads to a clear insight

Also propose a visual strategy: what animations/scenes would best support this narrative?`,
      })
      return object as LessonPlanningOutput
    }, "Lesson Planning")
  }

  /**
   * Stage 3: Script Generation
   * Generate Manim specification for rendering
   */
  async generateScript(
    query: string,
    lessonOutput: LessonPlanningOutput,
    queryOutput: QueryProcessingOutput
  ): Promise<ScriptGenerationOutput> {
    const schema = z.object({
      manim_spec: z.object({
        concept: z.string(),
        scenes: z.array(z.object({
          id: z.string(),
          objects: z.array(z.object({
            type: z.enum(["Axes", "Arrow", "Dot", "MathTex", "Text"]),
            params: z.record(z.unknown()),
          })),
          animations: z.array(z.object({
            type: z.enum(["Create", "Transform", "FadeIn", "Write"]),
            target: z.string(),
            duration: z.number(),
            easing: z.enum(["linear", "ease_in", "ease_out"]),
          })),
          text_overlay: z.string().optional(),
        })),
        parameters: z.record(z.unknown()),
      }),
    })

    return await this.retryWithBackoff(async () => {
      const { object } = await generateObject({
        model: google(this.modelName),
        schema,
        prompt: `You are a Manim animation designer creating visual specifications.

Concept: ${queryOutput.concepts[0] || "general"}
Visual scenes: ${JSON.stringify(lessonOutput.visual_strategy.scenes, null, 2)}

Create a Manim specification that describes the objects, animations, and parameters needed.
Keep it simple and focused on the key visual insights.`,
      })
      return object as ScriptGenerationOutput
    }, "Script Generation")
  }

  /**
   * Stream text generation token by token
   * Used for conversational explanation streaming
   */
  async *streamExplanation(prompt: string): AsyncGenerator<string> {
    // Use generateText for text generation
    const result = await generateText({
      model: google(this.modelName),
      prompt,
    })
    
    // Split the text into chunks for streaming effect
    const text = result.text
    const chunkSize = 10
    for (let i = 0; i < text.length; i += chunkSize) {
      yield text.slice(i, i + chunkSize)
    }
  }
}

export function getGeminiClient(
  onRetry?: (stage: string, attempt: number, delay: number) => void
): GeminiClient {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable is required")
  }
  
  // Set the env var if using GEMINI_API_KEY for backward compatibility
  if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY
  }
  
  const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash-exp"
  return new GeminiClient(apiKey, modelName, onRetry)
}
