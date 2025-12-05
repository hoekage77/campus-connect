# Lumina Video Generation Architecture

## Overview
The video generation process is fully integrated into the Lumina AI Tutor pipeline. It's triggered as a stage in the tutoring workflow when the system needs to visually explain a concept.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER INTERACTION                                                     │
│ - Lumina Workspace: User types a question                          │
│ - Click "Ask" button to trigger query                              │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND: hooks/use-lumina.ts                                        │
│ - Captures user query (e.g., "explain projectile motion")          │
│ - Establishes SSE (Server-Sent Events) connection                  │
│ - POST /api/lumina/query with { query, mode, context }             │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API LAYER: app/api/lumina/query/route.ts                            │
│ - Receives streaming request                                        │
│ - Creates TransformStream for SSE response                          │
│ - Forwards to AIOS Kernel client                                    │
│ - Streams events back to client in real-time                        │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ AIOS KERNEL (External Service - Port 8000)                          │
│ - Multi-stage pipeline:                                             │
│   1. query_understanding - Parse user intent                        │
│   2. knowledge_retrieval - Fetch relevant content                   │
│   3. reasoning_engine - Develop solution strategy                   │
│   4. explanation_generation - Create text explanation               │
│   5. visual_planning - [KEY STAGE] Plan the animation               │
│   6. code_generation - Generate Manim Python code                   │
│   7. animation_rendering - [EXECUTION] Render video                 │
│   8. answer_synthesis - Combine all outputs                         │
│                                                                      │
│ Each stage emits events:                                             │
│ - { type: "stage", stage: "visual_planning" }                       │
│ - { type: "visual-plan", scene: "...", spec: {...} }               │
│ - { type: "stage_output", stage: "animation_rendering", ... }      │
│ - { type: "done", video_url: "/path/to/video.mp4" }                │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ VIDEO GENERATION (Within AIOS Kernel)                               │
│                                                                      │
│ animation_rendering stage:                                          │
│ 1. Receives Manim code from code_generation stage                   │
│ 2. Executes Manim Community Edition:                                │
│    $ manim -ql render animation.py SceneName                        │
│ 3. Generates MP4 video (low-quality for speed)                      │
│ 4. Stores in temp directory or S3/CDN                               │
│ 5. Returns URL to client                                             │
│                                                                      │
│ Example Manim output:                                                │
│ ├─ media/                                                            │
│ │  └─ videos/                                                        │
│ │     └─ 1080p60/                                                    │
│ │        └─ ProjectileMotion.mp4 (generated video)                  │
│                                                                      │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND: app/lumina/workspace/page.tsx                              │
│                                                                      │
│ Displays streaming activity log:                                     │
│ ✓ Stage progress in real-time                                       │
│ ✓ Visual plan preview                                               │
│ ✓ Generated explanation text                                        │
│ ✓ **Video player** once animation_rendering completes              │
│                                                                      │
│ Canvas Panel (Tab: "Canvas"):                                        │
│ - Shows <video src={videoUrl} controls autoPlay />                  │
│ - Download button for MP4 file                                      │
│ - "Generated with Manim" attribution                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Integration Points

### 1. **Hook State Management** (hooks/use-lumina.ts)
```typescript
const [videoUrl, setVideoUrl] = useState<string | null>(null)

// When "done" event received with video_url:
else if (event.type === "done") {
  if (event.video_url) {
    setVideoUrl(event.video_url)  // ← Triggers re-render with video
  }
  setIsStreaming(false)
}
```

### 2. **Video Display** (app/lumina/workspace/page.tsx)
```tsx
{videoUrl ? (
  <div className="w-full h-full rounded-2xl border border-border/60 bg-black">
    <video 
      controls 
      src={videoUrl}
      className="flex-1 w-full h-full object-contain"
    />
    <div className="bg-background/95 px-4 py-3 flex items-center justify-between">
      <p>Animation Ready</p>
      <p>Generated with Manim</p>
      <Button asChild><a href={videoUrl} download>Download</a></Button>
    </div>
  </div>
) : (
  <ActivityLog />  // Show progress while generating
)}
```

### 3. **Streaming Events Pipeline**
```
Query Input
  ↓
[stage: query_understanding] → emit: "stage"
  ↓
[stage: knowledge_retrieval] → emit: "stage"
  ↓
... (other stages)
  ↓
[stage: visual_planning] → emit: "visual-plan", "stage_output"
  ↓
[stage: code_generation] → emit: "stage_output"
  ↓
[stage: animation_rendering] 
  ├→ emit: "stage"
  ├→ Run Manim (subprocess)
  ├→ Generate video file
  ├→ Upload/host video
  ├→ emit: "stage_output" with video metadata
  ├→ emit: "done" with video_url
  ↓
[Frontend] Display video
```

## How It Fits Into Spaces

### Current Implementation
- **Lumina** = AI Tutor for individual students
- Operates independently in `/lumina` and `/lumina/workspace`
- Used in **Office Hours spaces** potentially (tutor on demand)
- Used in **Peer Review spaces** (AI assistance during reviews)

### Future Integration Opportunities
1. **Within Study Session Spaces**
   - Generate explanatory videos on-the-fly for group
   - All participants see the same animated concept explanation
   - Video streamed via space's WebSocket

2. **Within Lecture Spaces**
   - Lecturer asks Lumina for visual aid
   - Video plays in shared canvas for all attendees
   - Records with space recording system

3. **Within Office Hours Spaces**
   - Student asks tutor question
   - Tutor can trigger Lumina to generate visualization
   - Both see animated explanation in real-time

4. **Archival & Reusability**
   - Store generated videos in space's recording system
   - Replay in future sessions
   - Share across groups with same topic

## Technical Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Streaming | Server-Sent Events (SSE) | Real-time event delivery to browser |
| Animation | Manim Community Edition | Renders math/physics visualizations |
| AI Kernel | AIOS Kernel (Python) | Orchestrates multi-stage pipeline |
| Frontend | React + TypeScript | Displays streaming progress and video |
| Video Format | MP4 H.264 | Browser-compatible, fast streaming |
| Quality | Low quality (480p) | Faster rendering (2-3s typical) |

## Performance Characteristics

- **Query to First Event**: ~200ms
- **Visual Planning Stage**: ~500-800ms
- **Code Generation**: ~300-500ms
- **Manim Rendering**: ~2-5s (depends on complexity)
- **Total Time**: ~3-8 seconds typical
- **Video Size**: 100-500KB (depending on complexity)

## Current Demo

**File**: `public/lumina-physics-demo.mp4`
- **Example**: Projectile motion animation
- **Duration**: ~6 seconds
- **Size**: 214KB
- **Location**: Embedded in Lumina landing page
- **Integration**: "Watch physics come to life" button opens modal with video

---

## Summary

The video generation is a **core capability** of Lumina that:
1. ✅ Generates on-demand educational videos
2. ✅ Streams progress to user in real-time
3. ✅ Integrates seamlessly into tutoring workspace
4. ✅ Can be extended to work within Spaces for group learning
5. ✅ Currently standalone, ready for Spaces integration

**Next step**: When integrating into Spaces, add WebSocket events to stream video generation progress to all space participants, enabling group learning experiences.
