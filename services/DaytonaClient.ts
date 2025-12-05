interface DaytonaWorkspace {
  id: string
  name: string
  target: string
  status: "running" | "stopped" | "starting" | "stopping"
}

interface CreateWorkspaceParams {
  name: string
  image?: string
  target?: string
}

/**
 * DaytonaClient
 * 
 * Manages ephemeral Daytona workspaces for isolated Manim execution
 */
export class DaytonaClient {
  private apiUrl: string
  private apiKey: string
  private defaultTarget: string

  constructor(apiUrl?: string, apiKey?: string, target?: string) {
    this.apiUrl = apiUrl || process.env.DAYTONA_SERVER_URL || ""
    this.apiKey = apiKey || process.env.DAYTONA_API_KEY || ""
    this.defaultTarget = target || process.env.DAYTONA_TARGET || "local"
  }

  /**
   * Check if Daytona is configured
   */
  isConfigured(): boolean {
    return !!(this.apiUrl && this.apiKey)
  }

  /**
   * Create a new workspace for Manim execution
   */
  async createWorkspace(params: CreateWorkspaceParams): Promise<DaytonaWorkspace> {
    if (!this.isConfigured()) {
      throw new Error("Daytona not configured")
    }

    const response = await fetch(`${this.apiUrl}/workspace`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        name: params.name,
        image: params.image || "manimcommunity/manim:latest",
        target: params.target || this.defaultTarget,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create workspace: ${error}`)
    }

    const workspace = await response.json() as DaytonaWorkspace
    
    // Wait for workspace to be running
    await this.waitForWorkspace(workspace.id, "running", 30000)
    
    return workspace
  }

  /**
   * Execute command in workspace
   */
  async executeCommand(workspaceId: string, command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (!this.isConfigured()) {
      throw new Error("Daytona not configured")
    }

    const response = await fetch(`${this.apiUrl}/workspace/${workspaceId}/exec`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ command }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to execute command: ${error}`)
    }

    return await response.json()
  }

  /**
   * Write file to workspace
   */
  async writeFile(workspaceId: string, path: string, content: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error("Daytona not configured")
    }

    const response = await fetch(`${this.apiUrl}/workspace/${workspaceId}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ path, content }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to write file: ${error}`)
    }
  }

  /**
   * Read file from workspace
   */
  async readFile(workspaceId: string, path: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("Daytona not configured")
    }

    const response = await fetch(`${this.apiUrl}/workspace/${workspaceId}/files/${encodeURIComponent(path)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to read file: ${error}`)
    }

    return await response.text()
  }

  /**
   * Download file from workspace as buffer
   */
  async downloadFile(workspaceId: string, path: string): Promise<Buffer> {
    if (!this.isConfigured()) {
      throw new Error("Daytona not configured")
    }

    const response = await fetch(`${this.apiUrl}/workspace/${workspaceId}/files/${encodeURIComponent(path)}/download`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to download file: ${error}`)
    }

    return Buffer.from(await response.arrayBuffer())
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    if (!this.isConfigured()) {
      return // Silently skip if not configured
    }

    try {
      const response = await fetch(`${this.apiUrl}/workspace/${workspaceId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        console.warn(`[DaytonaClient] Failed to delete workspace ${workspaceId}`)
      }
    } catch (error) {
      console.warn(`[DaytonaClient] Error deleting workspace:`, error)
    }
  }

  /**
   * Wait for workspace to reach desired status
   */
  private async waitForWorkspace(
    workspaceId: string,
    targetStatus: DaytonaWorkspace["status"],
    timeout: number = 30000
  ): Promise<void> {
    const startTime = Date.now()
    const pollInterval = 2000

    while (Date.now() - startTime < timeout) {
      const workspace = await this.getWorkspace(workspaceId)
      
      if (workspace.status === targetStatus) {
        return
      }

      if (workspace.status === "stopped" && targetStatus === "running") {
        throw new Error("Workspace stopped unexpectedly")
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }

    throw new Error(`Workspace did not reach ${targetStatus} status within ${timeout}ms`)
  }

  /**
   * Get workspace details
   */
  private async getWorkspace(workspaceId: string): Promise<DaytonaWorkspace> {
    const response = await fetch(`${this.apiUrl}/workspace/${workspaceId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get workspace: ${await response.text()}`)
    }

    return await response.json()
  }
}

// Singleton
let daytonaClient: DaytonaClient | null = null

export function getDaytonaClient(): DaytonaClient {
  if (!daytonaClient) {
    daytonaClient = new DaytonaClient()
  }
  return daytonaClient
}
