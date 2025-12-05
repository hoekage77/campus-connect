/**
 * Lumina Render API - Daytona-optimized version
 * 
 * This version assumes the application is running inside a Daytona workspace
 * with Manim pre-installed. No need for workspace provisioning - just execute!
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, mkdir, readFile } from 'fs/promises'
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

  ;(async () => {
    try {
      let scriptCode = ''

      // Check if we have a preset template (Tier 1: Fast)
      if (preset && preset in manimTemplates) {
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'progress',
              stage: 'generating',
              progress: 10,
              message: 'Using optimized template...',
            })}\n\n`
          )
        )

        const templateFn = manimTemplates[preset as TemplateKey]
        if (typeof templateFn === 'function') {
          const paramValues = Object.values(parameters) as number[]
          scriptCode = templateFn(...paramValues)
        } else {
          scriptCode = templateFn as string
        }
      } else {
        // Generate with Gemini (Tier 3: Custom)
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'progress',
              stage: 'generating',
              progress: 10,
              message: 'Generating custom Manim script with Gemini...',
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
- Return ONLY the Python code - NO markdown formatting, NO explanations, NO backticks`

        const result = await model.generateContent(prompt)
        scriptCode = result.response.text()
          .replace(/```python\n?/g, '')
          .replace(/```\n?/g, '')
          .trim()

        if (!scriptCode.includes('from manim import')) {
          scriptCode = 'from manim import *\n\n' + scriptCode
        }
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

      // Security validation
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
            message: 'Rendering animation with Manim (running in Daytona)...',
          })}\n\n`
        )
      )

      // Save script to temp file
      const scriptId = crypto.randomBytes(8).toString('hex')
      const scriptPath = path.join('/tmp', `lumina_${scriptId}.py`)
      await writeFile(scriptPath, scriptCode)

      // Ensure output directory exists
      const outputDir = path.join(process.cwd(), 'public', 'animations')
      await mkdir(outputDir, { recursive: true })

      // Extract scene class name
      const sceneMatch = scriptCode.match(/class\s+(\w+)\s*\(\s*Scene\s*\)/)
      const sceneName = sceneMatch ? sceneMatch[1] : 'DemoScene'

      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'progress',
            stage: 'rendering',
            progress: 50,
            message: `Executing Manim render for scene: ${sceneName}...`,
          })}\n\n`
        )
      )

      // Run Manim render
      try {
        const { stdout, stderr } = await execAsync(
          `manim render -ql --format=mp4 -o ${scriptId}.mp4 ${scriptPath}`,
          {
            timeout: 15000,
            cwd: '/tmp',
          }
        )

        console.log('Manim render output:', stdout)

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

        // Find and copy the rendered video
        const manimOutputPath = `/tmp/media/videos/lumina_${scriptId}/480p15/${sceneName}.mp4`
        const finalOutputPath = path.join(outputDir, `${scriptId}.mp4`)

        // Check if file exists and copy
        try {
          await execAsync(`cp "${manimOutputPath}" "${finalOutputPath}"`)
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
                  environment: 'daytona',
                },
              })}\n\n`
            )
          )
        } catch (copyError) {
          console.error('Failed to copy video:', copyError)
          throw new Error('Video file not found after render')
        }
      } catch (manimError: any) {
        console.error('Manim execution error:', manimError)

        // Check if it's a "command not found" error
        if (manimError.message.includes('command not found') || manimError.message.includes('ENOENT')) {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: 'Manim not installed. Please run this inside a Daytona workspace or install Manim locally.',
                code: 'MANIM_NOT_INSTALLED',
                script: scriptCode,
                fallback: true,
                instructions: 'See docs/DAYTONA_INTEGRATION.md for setup instructions',
              })}\n\n`
            )
          )
        } else {
          throw manimError
        }
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
