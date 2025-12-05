# Real-Time Activity Stream Feature

## Overview
Implemented a real-time activity stream in the visual canvas that shows agent reasoning and tool execution, similar to ChatGPT's tool calls or Claude's chain-of-thought display.

## User Experience

### What Users See
When a query is submitted, the visual canvas transforms into a live activity feed showing:

1. **Thinking Steps** (Purple) - When the agent starts processing each stage
2. **Outputs** (Green) - Completed stages with extracted data
3. **Retry Attempts** (Orange) - Rate limit handling with countdown
4. **Errors** (Red) - Any failures that occur

### Visual Design
Each activity card includes:
- **Icon indicator** (animated for active tasks)
- **Title** describing the action
- **Timestamp** showing when it occurred
- **Content** with additional details
- **Structured data** display for outputs

## Implementation Details

### 1. New Event Type (`hooks/use-lumina.ts`)

Added `stage_output` event to capture completed stage data:
```typescript
export type LuminaEvent =
  | { type: "stage_output"; stage: string; output: any }
  | ... // existing events
```

### 2. Activity Log Interface

```typescript
export interface ActivityLog {
  id: string               // Unique identifier
  timestamp: Date          // When the event occurred
  stage: string           // Which pipeline stage
  type: "thinking" | "output" | "retry" | "error"
  title: string           // Display title
  content?: string        // Optional description
  data?: any             // Structured output data
}
```

### 3. Hook Updates

**New State:**
```typescript
const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
```

**Event Handlers:**

**Thinking (Stage Start):**
```typescript
if (event.type === "stage") {
  setActivityLog((prev) => [
    ...prev,
    {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      stage: event.stage,
      type: "thinking",
      title: `Processing ${event.stage.replace(/_/g, " ")}...`,
    },
  ])
}
```

**Output (Stage Complete):**
```typescript
if (event.type === "stage_output") {
  setActivityLog((prev) => [
    ...prev,
    {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      stage: event.stage,
      type: "output",
      title: `Completed ${event.stage.replace(/_/g, " ")}`,
      data: event.output,
    },
  ])
}
```

**Retry:**
```typescript
if (event.type === "retry") {
  setActivityLog((prev) => [
    ...prev,
    {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      stage: event.stage,
      type: "retry",
      title: `Retrying ${event.stage.replace(/_/g, " ")}`,
      content: `Attempt ${event.attempt}, waiting ${Math.round(event.delay / 1000)}s`,
    },
  ])
}
```

### 4. Workspace UI Updates

**Auto-Scrolling Activity Feed:**
```typescript
const activityLogRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (activityLogRef.current) {
    activityLogRef.current.scrollTop = activityLogRef.current.scrollHeight
  }
}, [activityLog])
```

**Visual States:**
The canvas now has three display modes:

1. **Activity Stream** (when `isStreaming` or `activityLog.length > 0`)
   - Scrollable feed of agent actions
   - Auto-scrolls to latest activity
   - Color-coded by activity type

2. **Video Player** (when `videoUrl` is available)
   - Full video playback with controls
   - Download button
   - Animation metadata

3. **Empty State** (default)
   - Instructional message
   - Gallery icon placeholder

**Activity Card Design:**
```tsx
<div className="rounded-xl border p-4 transition-all animate-in slide-in-from-top-2">
  <div className="flex items-start gap-3">
    {/* Icon with animated pulse for active tasks */}
    <div className="flex h-8 w-8 items-center justify-center rounded-lg">
      <Icon className="animate-pulse" />
    </div>
    
    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-[10px] text-muted-foreground">
          {timestamp}
        </p>
      </div>
      
      {/* Optional description */}
      {content && <p className="text-xs">{content}</p>}
      
      {/* Structured data display */}
      {data && <DataDisplay stage={stage} data={data} />}
    </div>
  </div>
</div>
```

### 5. Structured Data Display

Different stages show relevant information:

**Query Processing:**
- Extracted concepts as badges
- Audience level
- Learning goals

**Lesson Planning:**
- Number of narrative steps
- Visual strategy summary

**Script Generation:**
- Scene name
- Animation parameters
- Manim specifications

## Example Activity Flow

```
[Purple Pulse] Processing query processing...
    10:23:45 AM

[Green Check] Completed query processing
    Concepts: projectile_motion, parabola, kinematics
    Audience: high_school
    10:23:47 AM

[Purple Pulse] Processing lesson planning...
    10:23:47 AM

[Green Check] Completed lesson planning
    Lesson Plan: 4 steps planned
    10:23:50 AM

[Purple Pulse] Processing script generation...
    10:23:50 AM

[Orange Spin] Retrying script generation
    Attempt 2, waiting 54s
    10:23:53 AM

[Green Check] Completed script generation
    Animation Spec: Scene: projectile_motion
    10:24:48 AM

[Purple Pulse] Processing animation synthesis...
    10:24:48 AM
```

## Benefits

1. **Transparency** - Users see exactly what the agent is doing
2. **Confidence** - Progress indicators reduce uncertainty during long operations
3. **Education** - Users learn how the system works
4. **Debugging** - Easy to spot where failures occur
5. **Engagement** - Interactive feedback keeps users engaged

## Technical Considerations

### Performance
- Activity log capped by browser memory (not an issue for typical sessions)
- Auto-scroll uses `scrollTop` (smooth, non-blocking)
- Animations use CSS (`animate-in`, `slide-in-from-top-2`)

### Accessibility
- Timestamps in readable format
- Color-coded with icons (not color-only)
- High contrast ratios maintained
- Scrollable with keyboard

### Future Enhancements

1. **Activity Filtering** - Filter by stage or type
2. **Collapsible Cards** - Expand/collapse detailed data
3. **Export Log** - Download activity history as JSON
4. **Search** - Find specific activities
5. **Pinning** - Pin important activities to top
6. **Timestamps** - Show relative time ("2 seconds ago")
7. **Progress Bar** - Visual progress indicator per stage
8. **Estimated Time** - Show expected completion time

## Usage

The activity stream automatically appears when:
- User submits a query
- Agent starts processing
- Any stage emits an event

No configuration needed - it's always-on feedback.

## Testing

To test the activity stream:

1. Open the Lumina workspace
2. Submit a query (e.g., "Explain projectile motion")
3. Watch the visual canvas transform into the activity feed
4. Observe real-time updates as stages complete
5. Check that auto-scroll keeps latest activity visible
6. Verify structured data displays correctly
7. Test retry scenarios (hit rate limits)

## Related Files

- `/hooks/use-lumina.ts` - Activity log state and event handling
- `/app/lumina/workspace/page.tsx` - Activity feed UI component
- `/services/LuminaOrchestrator.ts` - Emits `stage_output` events
- `/docs/RETRY_RESUME_IMPLEMENTATION.md` - Retry event handling

## Screenshot Description

The activity feed shows a vertical timeline of:
- Purple cards with pulsing icons for active thinking
- Green cards with checkmarks for completed stages
- Orange cards with spinning icons for retries
- Red cards with danger icons for errors

Each card slides in from top with smooth animation and includes:
- Stage icon on left
- Title and timestamp on right
- Optional description text
- Expandable structured data section

The feed auto-scrolls to keep the latest activity visible at the bottom.
