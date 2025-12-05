import { GoogleGenerativeAI } from '@google/generative-ai'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, mkdir } from 'fs/promises'
import { NextRequest } from 'next/server'
import path from 'path'
import crypto from 'crypto'
import { manimTemplates, type TemplateKey } from '@/lib/manim-templates'

const execAsync = promisify(exec)

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const { query, parameters = {}, preset = '' } = await req.json()

  // Start streaming response
  ;(async () => {
    try {
      let scriptCode = ''

      // Check if we have a preset template
      if (preset && preset in manimTemplates) {
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'progress',
              stage: 'generating',
              progress: 10,
              message: 'Using optimized template for faster rendering...',
            })}\n\n`
          )
        )

        // Use pre-built template (Tier 1 strategy - fastest)
        const templateFn = manimTemplates[preset as TemplateKey]
        if (typeof templateFn === 'function') {
          const paramValues = Object.values(parameters) as number[]
          scriptCode = templateFn(...paramValues)
        } else {
          scriptCode = templateFn as string
        }
        
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'progress',
              stage: 'validating',
              progress: 25,
              message: 'Template loaded successfully...',
            })}\n\n`
          )
        )
      } else {
        // Generate script with Gemini (Tier 3 strategy)
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'progress',
              stage: 'generating',
              progress: 10,
              message: 'Generating custom Manim script with Gemini 2.5 Flash...',
            })}\n\n`
          )
        )

        const prompt = `You are an expert in creating Manim (3Blue1Brown's mathematical animation library) Python scripts.

Generate a complete, valid Manim Python script for this query: "${query}"

${preset ? `Use this preset template style: ${preset}` : ''}
${Object.keys(parameters).length > 0 ? `Parameters: ${JSON.stringify(parameters)}` : ''}

CRITICAL REQUIREMENTS:
- Use "from manim import *"
- Create a Scene class that extends Scene
- Implement the construct() method
- Keep animation under 8 seconds total
- Use clear, educational animations (Write, Create, Transform, FadeIn, FadeOut, MoveAlongPath)
- Include descriptive text or equations using Text() or MathTex()
- Add appropriate wait() calls between animations
- Return ONLY the Python code - NO markdown formatting, NO explanations, NO backticks

Example structure:
from manim import *

class MyScene(Scene):
    def construct(self):
        title = Text("Concept Title")
        self.play(Write(title))
        self.wait(1)
        # More animations here
        self.wait(1)`

        const result = await model.generateContent(prompt)
        scriptCode = result.response.text()
          .replace(/```python\n?/g, '')
          .replace(/```\n?/g, '')
          .trim()

        // Ensure it starts with "from manim import *"
        if (!scriptCode.includes('from manim import')) {
          scriptCode = 'from manim import *\n\n' + scriptCode
        }

        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'progress',
              stage: 'validating',
              progress: 25,
              message: 'Validating script...',
            })}\n\n`
          )
        )
      }

      // Basic validation: check for dangerous imports
      const dangerousPatterns = [
        /import\s+os/,
        /import\s+subprocess/,
        /import\s+sys/,
        /from\s+os\s+import/,
        /from\s+subprocess\s+import/,
        /__import__/,
        /eval\(/,
        /exec\(/,
      ]

      for (const pattern of dangerousPatterns) {
        if (pattern.test(scriptCode)) {
          throw new Error('Script contains potentially dangerous code')
        }
      }

      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'progress',
            stage: 'rendering',
            progress: 35,
            message: 'Rendering animation with Manim...',
          })}\n\n`
        )
      )

      // Stage 2: Save script to temp file
      const scriptId = crypto.randomBytes(8).toString('hex')
      const scriptPath = path.join('/tmp', `lumina_${scriptId}.py`)
      await writeFile(scriptPath, scriptCode)

      // Stage 3: Ensure output directory exists
      const outputDir = path.join(process.cwd(), 'public', 'animations')
      await mkdir(outputDir, { recursive: true })

      // Stage 4: Run Manim (check if manim is installed, otherwise provide fallback)
      try {
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'progress',
              stage: 'rendering',
              progress: 50,
              message: 'Executing Manim render command...',
            })}\n\n`
          )
        )

        // Extract scene class name from script
        const sceneMatch = scriptCode.match(/class\s+(\w+)\s*\(\s*Scene\s*\)/)
        const sceneName = sceneMatch ? sceneMatch[1] : 'DemoScene'

        const outputFile = path.join(outputDir, `${scriptId}.mp4`)

        // Run manim with timeout
        const { stdout, stderr } = await execAsync(
          `manim render -ql --format=mp4 -o ${scriptId}.mp4 ${scriptPath}`,
          {
            timeout: 15000, // 15 second timeout
            cwd: '/tmp',
          }
        )

        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'progress',
              stage: 'encoding',
              progress: 85,
              message: 'Finalizing video...',
            })}\n\n`
          )
        )

        // Find the rendered video (Manim outputs to media/videos/...)
        const manimOutputPath = `/tmp/media/videos/lumina_${scriptId}/480p15/${sceneName}.mp4`
        
        // Copy to public directory
        await execAsync(`cp "${manimOutputPath}" "${outputFile}"`)

        const videoUrl = `/animations/${scriptId}.mp4`

        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'complete',
              videoUrl,
              duration: 8,
              scriptId,
              metadata: {
                resolution: '480p',
                sceneName,
              },
            })}\n\n`
          )
        )
      } catch (manimError: any) {
        // If Manim is not installed or fails, return the script for manual testing
        console.error('Manim execution error:', manimError)
        
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              message: 'Manim not installed on server. Script generated successfully but cannot render.',
              code: 'MANIM_NOT_AVAILABLE',
              script: scriptCode,
              fallback: true,
            })}\n\n`
          )
        )
      }

      await writer.close()
    } catch (error: any) {
      console.error('Lumina render error:', error)
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'error',
            message: error.message || 'Failed to generate animation',
            code: 'GENERATION_ERROR',
          })}\n\n`
        )
      )
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
