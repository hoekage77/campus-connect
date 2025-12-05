import { execFile } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import path from "path"
import crypto from "crypto"
import { getDaytonaClient } from "./DaytonaClient"

const execFileAsync = promisify(execFile)

type ManimSpec = {
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

/**
 * ManimRenderer
 * 
 * Direct Manim execution without external services
 * Generates Python code from specs and renders locally
 */
export class ManimRenderer {
  private tempDir: string
  private outputDir: string

  constructor() {
    this.tempDir = path.join(process.cwd(), "tmp", "manim")
    this.outputDir = path.join(process.cwd(), "public", "videos")
  }

  /**
   * Generate Manim Python code from specification
   */
  private generateManimCode(spec: ManimSpec): string {
    const { concept, scenes, parameters } = spec
    
    const className = this.toPascalCase(concept)
    
    // Build imports
    const imports = `from manim import *
import numpy as np

class ${className}(Scene):
    def construct(self):
`

    // Generate scene code
    let sceneCode = ""
    
    for (const scene of scenes) {
      sceneCode += `        # Scene: ${scene.id}\n`
      
      // Create objects
      for (const obj of scene.objects) {
        const varName = obj.type.toLowerCase()
        const params = this.formatParams(obj.params)
        sceneCode += `        ${varName} = ${obj.type}(${params})\n`
      }
      
      // Add animations
      for (const anim of scene.animations) {
        const animType = anim.type
        const target = anim.target
        const duration = anim.duration
        
        if (animType === "Create") {
          sceneCode += `        self.play(Create(${target}), run_time=${duration})\n`
        } else if (animType === "FadeIn") {
          sceneCode += `        self.play(FadeIn(${target}), run_time=${duration})\n`
        } else if (animType === "Transform") {
          sceneCode += `        self.play(Transform(${target}), run_time=${duration})\n`
        } else if (animType === "Write") {
          sceneCode += `        self.play(Write(${target}), run_time=${duration})\n`
        }
      }
      
      // Add text overlay if present
      if (scene.text_overlay) {
        sceneCode += `        text = Text("${scene.text_overlay}")\n`
        sceneCode += `        self.play(Write(text))\n`
        sceneCode += `        self.wait(2)\n`
        sceneCode += `        self.play(FadeOut(text))\n`
      }
      
      sceneCode += `        self.wait(1)\n\n`
    }
    
    return imports + sceneCode
  }

  /**
   * Generate simple fallback Manim scene
   */
  private generateFallbackCode(concept: string, parameters: Record<string, number>): string {
    const className = this.toPascalCase(concept)
    
    return `from manim import *

class ${className}(Scene):
    def construct(self):
        # Title
        title = Text("${concept.replace(/_/g, " ").toUpperCase()}")
        self.play(Write(title))
        self.wait(1)
        self.play(title.animate.to_edge(UP))
        
        # Create coordinate system
        axes = Axes(
            x_range=[-5, 5, 1],
            y_range=[-3, 3, 1],
            x_length=10,
            y_length=6,
        )
        self.play(Create(axes))
        
        # Add visual elements based on concept
        ${this.generateConceptSpecificCode(concept, parameters)}
        
        self.wait(2)
`
  }

  /**
   * Generate concept-specific visual code
   */
  private generateConceptSpecificCode(concept: string, params: Record<string, number>): string {
    if (concept.includes("projectile")) {
      const angle = params.angle || 45
      const speed = params.speed || 10
      
      return `
        # Projectile motion
        dot = Dot(color=BLUE).move_to(axes.c2p(-4, 0, 0))
        self.play(FadeIn(dot))
        
        # Trajectory path
        path = axes.plot(
            lambda x: -(x + 4)**2 / 4 + 2,
            color=YELLOW,
            x_range=[-4, 0]
        )
        
        self.play(
            MoveAlongPath(dot, path),
            Create(path),
            run_time=3,
            rate_func=linear
        )
`
    } else if (concept.includes("derivative") || concept.includes("calculus")) {
      return `
        # Derivative visualization
        curve = axes.plot(lambda x: x**2, color=BLUE)
        self.play(Create(curve))
        
        tangent = axes.plot(lambda x: 2*x, color=RED)
        self.play(Create(tangent))
        
        label = MathTex(r"f'(x) = 2x").next_to(tangent, UP)
        self.play(Write(label))
`
    } else {
      return `
        # Generic visualization
        curve = axes.plot(lambda x: np.sin(x), color=BLUE)
        self.play(Create(curve))
`
    }
  }

  /**
   * Render Manim scene to video
   * Uses Daytona sandbox if configured, otherwise falls back to local execution
   */
  async render(spec: ManimSpec): Promise<{ videoPath: string; duration: number }> {
    const startTime = Date.now()
    const daytonaClient = getDaytonaClient()
    
    // Use Daytona sandbox if configured
    if (daytonaClient.isConfigured()) {
      return await this.renderInDaytona(spec, startTime)
    }
    
    // Fallback to local execution
    return await this.renderLocally(spec, startTime)
  }

  /**
   * Render in Daytona sandbox (isolated environment)
   */
  private async renderInDaytona(spec: ManimSpec, startTime: number): Promise<{ videoPath: string; duration: number }> {
    const daytonaClient = getDaytonaClient()
    let workspaceId: string | null = null

    try {
      // Generate unique filename
      const hash = crypto.randomBytes(8).toString("hex")
      const filename = `${spec.concept}_${hash}`
      
      console.log("[ManimRenderer] Creating Daytona workspace...")
      
      // Create workspace
      const workspace = await daytonaClient.createWorkspace({
        name: `lumina-manim-${hash}`,
        image: "manimcommunity/manim:latest",
      })
      workspaceId = workspace.id
      
      console.log(`[ManimRenderer] Workspace created: ${workspaceId}`)
      
      // Generate Python code
      let code: string
      try {
        code = this.generateManimCode(spec)
      } catch (error) {
        console.warn("[ManimRenderer] Using fallback code generation:", error)
        code = this.generateFallbackCode(spec.concept, spec.parameters)
      }
      
      // Write Python file to workspace
      await daytonaClient.writeFile(workspaceId, `/manim/scene.py`, code)
      
      console.log("[ManimRenderer] Rendering in sandbox...")
      
      // Execute Manim in workspace
      const className = this.toPascalCase(spec.concept)
      const result = await daytonaClient.executeCommand(
        workspaceId,
        `manim render /manim/scene.py ${className} --quality=medium_quality --format=mp4 --output_file=/manim/${filename}.mp4`
      )
      
      if (result.exitCode !== 0) {
        console.error("[ManimRenderer] Manim stderr:", result.stderr)
        throw new Error(`Manim rendering failed: ${result.stderr}`)
      }
      
      console.log("[ManimRenderer] Downloading video...")
      
      // Download video from workspace
      const videoBuffer = await daytonaClient.downloadFile(workspaceId, `/manim/${filename}.mp4`)
      
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true })
      
      // Save video locally
      const outputPath = path.join(this.outputDir, `${filename}.mp4`)
      await fs.writeFile(outputPath, videoBuffer)
      
      const duration = Date.now() - startTime
      
      console.log(`[ManimRenderer] Render complete in ${duration}ms`)
      
      return {
        videoPath: `/videos/${filename}.mp4`,
        duration,
      }
    } catch (error) {
      console.error("[ManimRenderer] Daytona render error:", error)
      throw error
    } finally {
      // Cleanup workspace
      if (workspaceId) {
        console.log("[ManimRenderer] Cleaning up workspace...")
        await daytonaClient.deleteWorkspace(workspaceId)
      }
    }
  }

  /**
   * Render locally (requires Manim installed)
   */
  private async renderLocally(spec: ManimSpec, startTime: number): Promise<{ videoPath: string; duration: number }> {
    try {
      // Ensure directories exist
      await fs.mkdir(this.tempDir, { recursive: true })
      await fs.mkdir(this.outputDir, { recursive: true })
      
      // Generate unique filename
      const hash = crypto.randomBytes(8).toString("hex")
      const filename = `${spec.concept}_${hash}`
      const pyFile = path.join(this.tempDir, `${filename}.py`)
      
      // Generate Python code (try spec, fallback if complex)
      let code: string
      try {
        code = this.generateManimCode(spec)
      } catch (error) {
        console.warn("[ManimRenderer] Using fallback code generation:", error)
        code = this.generateFallbackCode(spec.concept, spec.parameters)
      }
      
      // Write Python file
      await fs.writeFile(pyFile, code)
      
      // Render with Manim
      const className = this.toPascalCase(spec.concept)
      const outputPath = path.join(this.outputDir, `${filename}.mp4`)
      
      try {
        await execFileAsync("manim", [
          "render",
          pyFile,
          className,
          "--quality=medium_quality",
          "--format=mp4",
          `--output_file=${outputPath}`,
          "--disable_caching",
        ], {
          timeout: 60000, // 60s timeout
        })
      } catch (renderError) {
        console.error("[ManimRenderer] Manim render failed:", renderError)
        throw new Error("Manim rendering failed")
      }
      
      // Cleanup temp file
      await fs.unlink(pyFile).catch(() => {})
      
      const duration = Date.now() - startTime
      
      return {
        videoPath: `/videos/${filename}.mp4`,
        duration,
      }
    } catch (error) {
      console.error("[ManimRenderer] Local render error:", error)
      throw error
    }
  }

  /**
   * Check if Manim is installed
   */
  async checkManimInstalled(): Promise<boolean> {
    try {
      await execFileAsync("manim", ["--version"])
      return true
    } catch {
      return false
    }
  }

  /**
   * Helper: Convert snake_case to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("")
  }

  /**
   * Helper: Format Python parameters
   */
  private formatParams(params: Record<string, any>): string {
    return Object.entries(params)
      .map(([key, value]) => {
        if (typeof value === "string") {
          return `${key}="${value}"`
        }
        return `${key}=${value}`
      })
      .join(", ")
  }
}

// Singleton
let manimRenderer: ManimRenderer | null = null

export function getManimRenderer(): ManimRenderer {
  if (!manimRenderer) {
    manimRenderer = new ManimRenderer()
  }
  return manimRenderer
}
