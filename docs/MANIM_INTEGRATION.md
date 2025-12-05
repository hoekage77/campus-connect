# Manim Integration Architecture for Lumina

## Overview

Lumina uses **Manim** (Mathematical Animation Engine by 3Blue1Brown) to generate high-quality educational animations. Manim is a Python library that programmatically creates precise mathematical and scientific visualizations.

---

## Architecture

### System Flow

```
User Query → Next.js API → Gemini 2.5 Flash Script Generation → Manim Renderer → Video Output → Frontend Display
```

### Why Gemini 2.5 Flash?

- **Ultra-fast response time**: <1s for code generation (faster than GPT-4)
- **Code generation strength**: Excellent at producing Python/programming code
- **Cost-effective**: More economical for high-volume requests
- **Large context window**: 1M tokens for complex queries
- **Multimodal**: Can accept images for diagram-to-animation conversion (future)

### Components

#### 1. **Backend Service** (`/api/lumina/render`)
- Receives natural language query from frontend
- Uses **Gemini 2.5 Flash** to generate Manim Python script
- Executes Manim render command in isolated environment
- Stores rendered video/GIF in public directory or cloud storage
- Returns video URL or streams rendering progress via SSE

#### 2. **Manim Script Generator** (AI-powered with Gemini 2.5 Flash)
- Converts user query into valid Manim scene code using Gemini API
- Leverages template library for common patterns
- Injects parameters (velocity, angle, mass, etc.) into scenes
- Validates script syntax before execution

#### 3. **Rendering Pipeline**
- Python subprocess executor with timeout controls
- Manim CLI: `manim render scene.py SceneName -ql` (low quality for speed)
- Progress tracking via stdout parsing
- Error handling and fallback mechanisms

#### 4. **Frontend Video Player**
- Displays rendered MP4/GIF in canvas area
- Controls: play, pause, scrub, speed, loop
- Loading states with progress percentage
- Fallback to static previews on error

---

## Manim Scene Structure

### Basic Template

```python
from manim import *

class PhysicsScene(Scene):
    def construct(self):
        # Title
        title = Text("Newton's Second Law")
        self.play(Write(title))
        self.wait(1)
        self.play(title.animate.to_edge(UP))
        
        # Equation
        equation = MathTex(r"F = ma")
        self.play(Write(equation))
        self.wait(2)
        
        # Visual demonstration
        box = Square(side_length=1, color=BLUE)
        arrow = Arrow(ORIGIN, RIGHT * 2, color=RED)
        
        self.play(Create(box), Create(arrow))
        self.play(box.animate.shift(RIGHT * 3), run_time=2)
        self.wait(1)
```

### Scene Categories

#### **1. Projectile Motion**
```python
class ProjectileMotion(Scene):
    def construct(self):
        # Set up coordinate system
        axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 5, 1],
            x_length=10,
            y_length=5,
        )
        labels = axes.get_axis_labels(x_label="x (m)", y_label="y (m)")
        
        # Projectile
        ball = Dot(color=BLUE, radius=0.15).move_to(axes.c2p(0, 0))
        
        # Trajectory path
        v0 = 10  # m/s
        angle = 45  # degrees
        g = 9.8  # m/s^2
        
        def trajectory(t):
            x = v0 * np.cos(np.radians(angle)) * t
            y = v0 * np.sin(np.radians(angle)) * t - 0.5 * g * t**2
            return axes.c2p(x, y)
        
        path = ParametricFunction(
            lambda t: trajectory(t),
            t_range=[0, 2.04],
            color=YELLOW,
        )
        
        self.play(Create(axes), Write(labels))
        self.play(Create(path), MoveAlongPath(ball, path), run_time=4, rate_func=linear)
        self.wait(1)
```

#### **2. Electric Field**
```python
class ElectricField(Scene):
    def construct(self):
        # Charges
        positive = Circle(radius=0.3, color=RED, fill_opacity=1)
        positive.move_to(LEFT * 2)
        pos_label = MathTex("+Q").next_to(positive, UP)
        
        negative = Circle(radius=0.3, color=BLUE, fill_opacity=1)
        negative.move_to(RIGHT * 2)
        neg_label = MathTex("-Q").next_to(negative, UP)
        
        # Field lines
        field_lines = VGroup()
        for angle in np.linspace(0, 360, 12, endpoint=False):
            rad = np.radians(angle)
            start = positive.get_center() + 0.3 * np.array([np.cos(rad), np.sin(rad), 0])
            end = start + 1.5 * np.array([np.cos(rad), np.sin(rad), 0])
            line = Arrow(start, end, color=YELLOW, buff=0, stroke_width=2)
            field_lines.add(line)
        
        self.play(Create(positive), Write(pos_label), Create(negative), Write(neg_label))
        self.play(Create(field_lines, lag_ratio=0.1))
        self.wait(2)
```

#### **3. Quadratic Function**
```python
class QuadraticFunction(Scene):
    def construct(self):
        axes = Axes(
            x_range=[-5, 5, 1],
            y_range=[-2, 10, 2],
            x_length=10,
            y_length=6,
        )
        labels = axes.get_axis_labels()
        
        # Function: y = x^2 - 2x + 1
        graph = axes.plot(lambda x: x**2 - 2*x + 1, color=BLUE)
        equation = MathTex(r"y = x^2 - 2x + 1").to_edge(UP)
        
        # Vertex
        vertex = Dot(axes.c2p(1, 0), color=RED, radius=0.1)
        vertex_label = MathTex(r"(1, 0)").next_to(vertex, DOWN)
        
        self.play(Create(axes), Write(labels))
        self.play(Write(equation))
        self.play(Create(graph), run_time=2)
        self.play(FadeIn(vertex), Write(vertex_label))
        self.wait(2)
```

#### **4. Calculus - Derivative**
```python
class DerivativeVisualization(Scene):
    def construct(self):
        axes = Axes(x_range=[-3, 3], y_range=[-1, 9])
        
        # Original function
        func = axes.plot(lambda x: x**2, color=BLUE)
        func_label = MathTex(r"f(x) = x^2").to_edge(UP)
        
        # Tangent line animation
        x_val = ValueTracker(-2)
        
        def get_tangent_line():
            x = x_val.get_value()
            slope = 2 * x  # derivative
            point = axes.c2p(x, x**2)
            
            line = Line(
                point + LEFT * 1.5 + DOWN * 1.5 * slope,
                point + RIGHT * 1.5 + UP * 1.5 * slope,
                color=YELLOW,
            )
            return line
        
        tangent = always_redraw(get_tangent_line)
        dot = always_redraw(lambda: Dot(axes.c2p(x_val.get_value(), x_val.get_value()**2), color=RED))
        
        self.play(Create(axes), Write(func_label))
        self.play(Create(func))
        self.play(FadeIn(dot), Create(tangent))
        self.play(x_val.animate.set_value(2), run_time=4, rate_func=smooth)
        self.wait(1)
```

---

## API Specification

### POST `/api/lumina/render`

**Request:**
```typescript
{
  query: string              // Natural language query
  preset?: string            // Optional preset template name
  parameters?: {             // Optional scene parameters
    velocity?: number
    angle?: number
    mass?: number
    duration?: number
  }
  quality?: 'low' | 'medium' | 'high'  // Render quality (default: low for speed)
}
```

**Response (SSE Stream):**
```typescript
// Progress events
{
  type: 'progress'
  stage: 'generating' | 'rendering' | 'encoding' | 'complete'
  progress: number  // 0-100
  message: string
}

// Completion event
{
  type: 'complete'
  videoUrl: string
  duration: number
  frames: number
  metadata: {
    resolution: string
    fileSize: number
    renderTime: number
  }
}

// Error event
{
  type: 'error'
  message: string
  code: string
}
```

---

## Implementation Steps

### Phase 1: Environment Setup

**1. Install Manim in backend environment:**
```bash
pip install manim
```

**2. Verify Manim installation:**
```bash
manim --version
```

**3. Install Google Generative AI SDK:**
```bash
pnpm add @google/generative-ai
```

**4. Configure Gemini API key:**
```bash
# .env.local
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

**5. Create output directory for rendered videos:**
```bash
mkdir -p public/animations
```

### Phase 2: Script Generation Service

**1. Initialize Gemini 2.5 Flash client:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
```

**2. Create prompt template for Manim code generation:**
```typescript
const MANIM_PROMPT = `You are a Manim animation expert. Generate a complete, valid Manim Python script based on this query.

Query: {USER_QUERY}
Parameters: {PARAMETERS}

Requirements:
- Use "from manim import *"
- Create a Scene class that extends Scene
- Implement construct() method
- Include clear comments
- Use appropriate animations (Write, Create, Transform, FadeIn, etc.)
- Keep scenes under 10 seconds for speed
- Return ONLY the Python code, no explanations

Example structure:
from manim import *

class MyScene(Scene):
    def construct(self):
        # Your animation code here
        pass
`
```

**3. Build validation layer to check generated Python syntax**
**4. Implement parameter injection system**
**5. Create template library for common scenes**

### Phase 3: Rendering Service
1. Build Python subprocess executor with security sandboxing
2. Implement timeout and resource limits
3. Parse Manim CLI output for progress tracking
4. Handle errors and provide fallback mechanisms

### Phase 4: Frontend Integration
1. Update AI page canvas to display video player
2. Implement SSE client for progress updates
3. Add video controls (play, pause, scrub, speed)
4. Create loading states with progress indicators

### Phase 5: Optimization
1. Cache commonly requested animations
2. Pre-render preset demos
3. Implement queue system for concurrent requests
4. Add CDN for video delivery

---

## Example: Full Integration Flow

### 1. User Query
```
"Show me how a ball moves when thrown at 45 degrees with initial velocity 20 m/s"
```

### 2. Gemini 2.5 Flash Generated Script
```python
from manim import *

class ProjectileDemo(Scene):
    def construct(self):
        # Parameters from user
        v0 = 20  # m/s
        angle = 45  # degrees
        g = 9.8
        
        title = Text("Projectile Motion: v₀=20 m/s, θ=45°")
        self.play(Write(title))
        self.play(title.animate.to_edge(UP))
        
        axes = Axes(x_range=[0, 50], y_range=[0, 25])
        ball = Dot(color=BLUE).move_to(axes.c2p(0, 0))
        
        # Trajectory calculation
        t_max = 2 * v0 * np.sin(np.radians(angle)) / g
        path = ParametricFunction(
            lambda t: axes.c2p(
                v0 * np.cos(np.radians(angle)) * t,
                v0 * np.sin(np.radians(angle)) * t - 0.5 * g * t**2
            ),
            t_range=[0, t_max],
            color=YELLOW
        )
        
        self.play(Create(axes))
        self.play(Create(path), MoveAlongPath(ball, path), run_time=4)
        self.wait(1)
```

### 3. Manim Render Command
```bash
manim render -ql --format=mp4 /tmp/lumina_scene_xyz.py ProjectileDemo
```

### 4. Output
```
/tmp/media/videos/lumina_scene_xyz/480p15/ProjectileDemo.mp4
```

### 5. Frontend Display
```tsx
<video 
  src="/api/videos/ProjectileDemo.mp4"
  controls
  autoPlay
  className="w-full h-full"
/>
```

---

## API Implementation Example

### Backend Route: `/api/lumina/render/route.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, mkdir } from 'fs/promises'
import { NextRequest } from 'next/server'
import path from 'path'
import crypto from 'crypto'

const execAsync = promisify(exec)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const { query, parameters = {} } = await req.json()

  // Start streaming response
  ;(async () => {
    try {
      // Stage 1: Generate script with Gemini
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'progress', stage: 'generating', progress: 10, message: 'Generating Manim script...' })}\n\n`))

      const prompt = `Generate a complete Manim Python script for: "${query}"
Parameters: ${JSON.stringify(parameters)}

Requirements:
- Use "from manim import *"
- Create a Scene class
- Keep animation under 8 seconds
- Return ONLY Python code, no markdown or explanations`

      const result = await model.generateContent(prompt)
      const scriptCode = result.response.text()
        .replace(/```python\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'progress', stage: 'rendering', progress: 30, message: 'Rendering animation...' })}\n\n`))

      // Stage 2: Save script to temp file
      const scriptId = crypto.randomBytes(8).toString('hex')
      const scriptPath = path.join('/tmp', `lumina_${scriptId}.py`)
      await writeFile(scriptPath, scriptCode)

      // Stage 3: Run Manim
      const outputDir = path.join(process.cwd(), 'public', 'animations')
      await mkdir(outputDir, { recursive: true })

      const { stdout } = await execAsync(
        `manim render -ql --format=mp4 --output_file=${scriptId}.mp4 ${scriptPath}`,
        { timeout: 10000 }
      )

      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'progress', stage: 'encoding', progress: 80, message: 'Finalizing video...' })}\n\n`))

      // Stage 4: Move video to public directory
      const videoUrl = `/animations/${scriptId}.mp4`

      await writer.write(encoder.encode(`data: ${JSON.stringify({ 
        type: 'complete', 
        videoUrl, 
        duration: 8,
        metadata: { scriptId }
      })}\n\n`))

      await writer.close()
    } catch (error: any) {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ 
        type: 'error', 
        message: error.message 
      })}\n\n`))
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
```

---

## Security Considerations

1. **Sandboxing**: Execute Manim in isolated Docker container or restricted Python environment
2. **Timeout**: Limit render time to 30s max
3. **Code Validation**: Check for dangerous imports (os, subprocess, sys)
4. **Resource Limits**: Cap CPU/memory usage per render
5. **Rate Limiting**: Max 10 renders per user per minute
6. **Input Sanitization**: Validate all user parameters before injection

---

## Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Script Generation | <1s | Gemini 2.5 Flash (ultra-fast) with cached templates |
| Manim Render | <7s | Low quality (-ql), simple scenes |
| Video Delivery | <1s | Local storage / CDN |
| **Total Latency** | **<9s** | End-to-end optimization |

---

## Fallback Strategy

If Manim rendering fails or exceeds timeout:
1. Return static preview image from template library
2. Show error message with option to retry
3. Queue request for background processing
4. Notify user when render completes

---

## Future Enhancements

1. **Interactive Manim**: Allow real-time parameter updates via UI sliders
2. **Collaborative Editing**: Multiple users can fork and modify scenes
3. **Animation Library**: User-generated template marketplace
4. **Multi-language Support**: Generate Manim scripts in user's preferred language
5. **Mobile Optimization**: Adaptive quality based on device/network
6. **3D Scenes**: Support Manim's ThreeDScene for spatial visualizations

---

## Resources

- **Manim Documentation**: https://docs.manim.community/
- **Manim Gallery**: https://docs.manim.community/en/stable/examples.html
- **3Blue1Brown Channel**: https://www.youtube.com/c/3blue1brown
- **Manim GitHub**: https://github.com/ManimCommunity/manim
