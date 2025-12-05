/**
 * AIOS Kernel Client
 * 
 * Connects Next.js API route to AIOS kernel
 * Provides unified interface for:
 * - Running Lumina queries via AIOS
 * - Managing agent state
 * - Handling retries and failures
 */

export interface AIosKernelConfig {
  host?: string
  port?: number
  protocol?: "http" | "https"
}

export class AIosKernelClient {
  private baseUrl: string

  constructor(config: AIosKernelConfig = {}) {
    const host = config.host || process.env.AIOS_HOST || "localhost"
    const port = config.port || parseInt(process.env.AIOS_PORT || "8000")
    const protocol = config.protocol || "http"

    this.baseUrl = `${protocol}://${host}:${port}`
  }

  /**
   * Execute Lumina query via AIOS kernel
   * Streams events back for real-time UI updates
   */
  async *executeLuminaQuery(
    userId: string,
    query: string,
    mode: string = "explain",
    resumeFrom?: string
  ): AsyncGenerator<any, void> {
    const url = `${this.baseUrl}/api/lumina/query`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        query,
        mode,
        resume_from: resumeFrom,
      }),
    })

    if (!response.ok) {
      throw new Error(`AIOS kernel error: ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error("No response body from AIOS kernel")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const text = decoder.decode(value)
        const lines = text.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const eventData = line.slice(6)
            if (eventData) {
              try {
                const event = JSON.parse(eventData)
                yield event
              } catch (e) {
                console.error("Failed to parse AIOS event:", eventData)
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Get Lumina agent info from AIOS kernel
   */
  async getLuminaAgentInfo() {
    const response = await fetch(`${this.baseUrl}/api/agent/lumina`)

    if (!response.ok) {
      throw new Error(`Failed to fetch agent info: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Health check for AIOS kernel
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch {
      return false
    }
  }
}

// Singleton instance
let kernelClient: AIosKernelClient | null = null

export function getAIosKernelClient(
  config?: AIosKernelConfig
): AIosKernelClient {
  if (!kernelClient) {
    kernelClient = new AIosKernelClient(config)
  }
  return kernelClient
}
