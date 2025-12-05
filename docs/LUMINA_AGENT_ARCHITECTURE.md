# Lumina Agent Architecture

## Overview

Lumina is a multi-stage AI tutoring agent that transforms STEM questions into visual, conversational explanations. It orchestrates between conversational pedagogy (powered by Gemini 2.0 Flash) and visual synthesis (via Manim/Xera Animate) to deliver "aha!" moments.

---

## Architecture Components

### 1. Agent Run Orchestrator

**Purpose:** Manages the lifecycle of a single Lumina query from input to final response.

**Responsibilities:**
- Initialize sandbox environment for isolated Manim execution
- Coordinate pipeline stages
- Stream events to frontend via SSE
- Handle errors and timeouts gracefully

**Key Entities:**

```typescript
interface AgentRun {
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

interface StageExecution {
  stage: "query_processing" | "lesson_planning" | "script_generation" | "animation_synthesis" | "optimization"
  status: "pending" | "active" | "completed" | "failed"
  startedAt?: Date
  completedAt?: Date
  output?: any
  error?: string
}
```

---

## Pipeline Stages

### Stage 1: Query Processing

**Goal:** Parse user intent, extract mathematical concepts, and determine tutoring strategy.

**Actions:**
1. Classify query type (conceptual, procedural, exploratory, "what-if")
2. Extract key concepts and prerequisites
3. Determine target audience level (inferred from context or defaults to high school)
4. Generate a pedagogical goal statement

**Output:**
```typescript
{
  concepts: string[]           // ["projectile_motion", "parabola", "constant_acceleration"]
  audience: string             // "high_school"
  goal: string                 // "Build intuition for why projectile paths are parabolic"
  tone: string                 // "exploratory"
  prerequisites: string[]      // ["vectors", "kinematics"]
}
```

**LLM Integration:**
- **Model:** Gemini 2.0 Flash (`gemini-2.0-flash-exp`)
- **Implementation:** `GeminiClient.processQuery(query, mode)`
- **Output Format:** Structured JSON with concepts, audience, goal, tone, prerequisites

**Agent Prompt Template:**
```
You are a STEM tutoring assistant. A student asks: "{query}".

1. Identify the core concepts involved.
2. Determine the appropriate audience level.
3. State the pedagogical goal in one sentence.
4. Suggest a tone (exploratory, formal, enthusiastic).

Return JSON matching the schema above.
```

---

### Stage 2: Lesson Planning

**Goal:** Design a narrative structure and visual strategy for the explanation.

**Actions:**
1. Break the concept into digestible steps
2. Propose a sequence of scenes/visuals
3. Identify key "aha!" moments
4. Define what text/equations to display at each step

**Output:**
```typescript
{
  narrative: {
    hook: string                    // "Why does a thrown ball follow a curved path?"
    steps: Array<{
      title: string                 // "Separate horizontal and vertical motion"
      explanation: string           // Text for this step
      visual_cue: string            // "Split velocity vector into components"
    }>
    conclusion: string              // "The combination of constant horizontal speed and accelerated vertical motion creates the parabola"
  }
  visual_strategy: {
    scenes: Array<{
      id: string                    // "projectile_intro"
      description: string           // "2D coordinate system with trajectory traced"
      duration: number              // Estimated seconds
    }>
  }
}
```

**LLM Integration:**
- **Model:** Gemini 2.0 Flash (`gemini-2.0-flash-exp`)
- **Implementation:** `GeminiClient.planLesson(query, queryOutput)`
- **Output Format:** Structured JSON with narrative steps and visual scenes

**Agent Prompt Template:**
```
Concept: {concept}
Goal: {goal}
Audience: {audience}

Design a 3-5 step lesson narrative. Each step should:
- Build intuition before formulas
- Use visual metaphors where possible
- Lead to a clear insight

Also propose a visual strategy: what scenes/animations would best support this narrative?

Return JSON with narrative.steps[] and visual_strategy.scenes[].
```

---

### Stage 3: Script Generation

**Goal:** Produce a detailed Manim script specification or pseudocode for Xera Animate.

**Actions:**
1. Map narrative steps to Manim scene objects
2. Specify parameters (colors, positions, timing)
3. Generate LaTeX for equations
4. Define animations and transitions

**Output:**
```typescript
{
  manim_spec: {
    concept: string                 // "projectile_motion"
    scenes: Array<{
      id: string
      objects: Array<{
        type: string                // "Arrow", "Dot", "Axes", "MathTex"
        params: Record<string, any> // { color: BLUE, start: [0,0,0], end: [2,3,0] }
      }>
      animations: Array<{
        type: string                // "Create", "Transform", "FadeIn"
        target: string              // Object reference
        duration: number
        easing: string
      }>
      text_overlay?: string
    }>
    parameters: Record<string, number> // { angle: 45, speed: 10, gravity: 9.8 }
  }
}
```

**LLM Integration:**
- **Model:** Gemini 2.0 Flash (`gemini-2.0-flash-exp`)
- **Implementation:** `GeminiClient.generateScript(query, lessonOutput, queryOutput)`
- **Output Format:** Detailed Manim specification with scenes, objects, animations, parameters

**Integration Point:** This spec is handed to Xera Animate for code generation.

---

### Stage 4: Animation Synthesis

**Goal:** Execute Manim code in a sandboxed environment and produce a video clip or return a visual plan.

**Actions:**
1. **Initialize Sandbox:**
   - Spin up isolated container/VM (e.g., Daytona workspace)
   - Pre-install Manim Community Edition, LaTeX, and dependencies
   
2. **Invoke Xera Animate Agent:**
   - Pass `manim_spec` from Stage 3
   - Use Xera Animate system prompt with tools enabled:
     - `sb_files_tool` (write Manim .py files)
     - `sb_shell_tool` (run `manim render`)
     - `sb_vision_tool` (optional: verify output visually)
   
3. **Execute Manim:**
   ```bash
   manim render scene.py SceneName --quality=medium_quality --output_file=/tmp/output.mp4
   ```
   
4. **Capture Output:**
   - On success: stream video URL or base64-encoded clip
   - On error: capture traceback and retry with simplified spec

**Output:**
```typescript
{
  video_url?: string              // URL to rendered MP4
  visual_plan: {                  // Fallback if video generation fails
    scene: string
    spec: {
      concept: string
      parameters: Record<string, any>
    }
  }
  status: "success" | "fallback" | "failed"
  execution_time: number          // milliseconds
  error?: string
}
```

**Sandbox Architecture:**

```
┌─────────────────────────────────────┐
│   Daytona Workspace (per run)      │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Xera Animate Agent          │  │
│  │  - System prompt loaded      │  │
│  │  - Tools: sb_files, sb_shell │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Manim CE + LaTeX            │  │
│  │  /workspace/scene.py         │  │
│  │  /media/videos/output.mp4    │  │
│  └──────────────────────────────┘  │
│                                     │
│  Environment:                       │
│  - Python 3.10+                     │
│  - manim, numpy, scipy              │
│  - ffmpeg, latex                    │
└─────────────────────────────────────┘
```

---

### Stage 5: Optimization

**Goal:** Refine explanation text, ensure pacing, and compress assets.

**Actions:**
1. Review generated explanation for clarity and conciseness
2. Compress video if needed (target <5MB for web delivery)
3. Generate thumbnail or preview frame
4. Cache result for future similar queries

**Output:**
```typescript
{
  optimized_answer: string        // Cleaned, concise explanation
  video_url?: string              // Optimized video
  thumbnail_url?: string
  cache_key?: string              // For retrieval
}
```

---

## API Contract: Agent Run Creation

### POST `/api/lumina/agent-run`

**Request:**
```json
{
  "query": "Explain projectile motion",
  "mode": "explain",
  "context": {
    "courseId": "physics-101",
    "history": [
      { "role": "user", "content": "What is acceleration?" },
      { "role": "assistant", "content": "Acceleration is..." }
    ]
  }
}
```

**Response (SSE Stream):**
```
data: {"type":"run_created","runId":"run_abc123"}

data: {"type":"stage","stage":"query_processing"}

data: {"type":"stage_output","stage":"query_processing","output":{...}}

data: {"type":"stage","stage":"lesson_planning"}

data: {"type":"token","content":"Let's start by separating..."}

data: {"type":"stage","stage":"script_generation"}

data: {"type":"stage","stage":"animation_synthesis"}

data: {"type":"visual-plan","scene":"projectile_motion_intro","spec":{...}}

data: {"type":"stage","stage":"optimization"}

data: {"type":"done","runId":"run_abc123","video_url":"https://..."}
```

---

## Implementation Plan

### Phase 1: Core Orchestrator (MVP)
1. Create `services/LuminaOrchestrator.ts`:
   - `createRun(query, mode, context)` → runId
   - `executeStage(runId, stage)` → stage output
   - `streamEvents(runId)` → SSE generator

2. Update `/api/lumina/query/route.ts`:
   - Call `LuminaOrchestrator.createRun()`
   - Stream stage events as they complete
   - For now, stub Stage 4 (animation synthesis) with mock visual plan

### Phase 1.5: Gemini Integration (✅ COMPLETED)
1. Installed `@google/generative-ai` SDK
2. Created `services/GeminiClient.ts` with structured output methods:
   - `processQuery()` → Stage 1 output
   - `planLesson()` → Stage 2 output
   - `generateScript()` → Stage 3 output
3. Wired Gemini into LuminaOrchestrator stages 1-3
4. Added `GEMINI_API_KEY` and `GEMINI_MODEL_NAME` env vars

### Phase 2: Xera Animate Integration
1. Set up Daytona template with Manim + agent:
   - Base image: `manimcommunity/manim:latest`
   - Install Xera Animate agent runtime
   - Expose API for script execution

2. Create `services/XeraAnimateClient.ts`:
   - `submitManimSpec(spec)` → job ID
   - `pollJob(jobId)` → video URL or error
   - `cleanup(jobId)` → teardown sandbox

3. Wire into Stage 4:
   - Send `manim_spec` to Xera via HTTP/gRPC
   - Stream progress events back to frontend
   - Handle timeouts (max 60s per render)

### Phase 3: Persistence & Caching
1. Store `AgentRun` records in Supabase:
   - Table: `lumina_runs`
   - Track status, stages, and results
   - Index by userId, createdAt for history

2. Cache rendered videos:
   - Key by hash of `manim_spec`
   - Store in R2/S3 or Supabase Storage
   - Return cached video if same spec requested

---

## Environment Variables

Add to `.env.local`:

```bash
# Lumina Agent Configuration
LUMINA_ORCHESTRATOR_ENABLED=true
LUMINA_MODEL_PROVIDER=anthropic  # or openai
LUMINA_MODEL_NAME=claude-sonnet-4.5

# Xera Animate / Daytona Integration
DAYTONA_WORKSPACE_API_URL=https://daytona.example.com/api
DAYTONA_API_KEY=dtyn_xxxxx
XERA_AGENT_ENDPOINT=https://xera.daytona.example.com
XERA_AGENT_TIMEOUT_MS=60000

# Manim Sandbox
MANIM_RENDER_QUALITY=medium_quality
MANIM_MAX_DURATION_SEC=30
MANIM_OUTPUT_BUCKET=lumina-videos

# Caching
LUMINA_CACHE_ENABLED=true
LUMINA_CACHE_TTL_SEC=604800  # 7 days
```

---

## Next Steps

1. **Implement `LuminaOrchestrator` service** with stage execution logic
2. **Scaffold Xera Animate integration** with Daytona sandbox API
3. **Wire orchestrator into `/api/lumina/query` route**
4. **Test end-to-end with a simple projectile motion query**
5. **Add video upload/storage for rendered clips**

---

## Notes

- **Fallback Strategy:** If Manim rendering fails or times out, return a `visual-plan` event only (which frontend already handles) and show a static placeholder or the last successful render.
- **Cost Management:** Limit concurrent sandbox instances; queue requests if needed.
- **Security:** Validate all Manim code for malicious imports or file system access before execution.
