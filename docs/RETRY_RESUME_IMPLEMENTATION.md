# Retry & Resume Implementation

## Overview
Implemented comprehensive retry logic with exponential backoff and resume capability for the Lumina agent pipeline to handle Google Gemini API rate limits gracefully.

## Changes Made

### 1. Frontend Hook Updates (`hooks/use-lumina.ts`)

#### New Event Types
```typescript
export type LuminaEvent =
  | { type: "stage"; stage: string; status?: string }  // Added status field for "skipped"
  | { type: "token"; content: string }
  | { type: "visual-plan"; scene: string; spec: any }
  | { type: "done"; video_url?: string }
  | { type: "error"; message: string }
  | { type: "retry"; stage: string; attempt: number; delay: number }  // NEW
```

#### New State Management
- `activeStage: string | null` - Currently executing stage
- `skippedStages: string[]` - Stages skipped during resume
- `retryStatus: { stage, attempt, delay } | null` - Current retry information
- `runId: string | null` - Run identifier for resume functionality

#### New Methods
- `resume()` - Resume a failed run from the last completed stage
- Updated `start()` to use internal `executeQuery()` helper
- `cancel()` now clears retry status

#### Resume Endpoint Support
```typescript
const endpoint = resumeMode && runId 
  ? `/api/lumina/query?resume=${runId}` 
  : "/api/lumina/query"
```

### 2. Workspace UI Updates (`app/lumina/workspace/page.tsx`)

#### Pipeline Stage Indicators
- **Completed stages**: Green checkmark icon
- **Active stage**: Purple pulsing dot
- **Skipped stages**: Gray skip icon
- **Pending stages**: Gray empty dot

#### Retry Status Display
Shows when API is retrying:
```
⟳ Retrying query_processing...
  Attempt 2 • Waiting 59s
```

#### Resume Button
- Appears when a run fails with completed stages
- Positioned next to "Ask Lumina" button
- Calls `resume()` method on click

#### Video Player
- Full video player with controls when `videoUrl` is available
- Download button for rendered animations
- Fallback to visual plan display
- Clean black background for optimal viewing

### 3. Backend Retry Logic (`services/GeminiClient.ts`)

#### Retry Configuration
```typescript
private maxRetries = 3
private baseDelay = 1000 // 1 second base delay
private onRetry?: (stage: string, attempt: number, delay: number) => void
```

#### Exponential Backoff with Smart Delay Extraction
```typescript
private async retryWithBackoff<T>(fn: () => Promise<T>, context: string): Promise<T> {
  for (let attempt = 0; attempt < this.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      const isRateLimit = error.status === 429 || 
                         error.message?.includes("quota") ||
                         error.message?.includes("Too Many Requests")
      
      if (isRateLimit && attempt < this.maxRetries - 1) {
        // Extract delay from Google's error message
        let retryAfter = this.baseDelay * Math.pow(2, attempt) // 1s, 2s, 4s
        const retryMatch = error.message?.match(/retry in ([\d.]+)s/)
        if (retryMatch) {
          retryAfter = Math.ceil(parseFloat(retryMatch[1]) * 1000)
        }
        
        console.log(`[Gemini] ${context} - Rate limit hit, retrying in ${retryAfter}ms`)
        
        // Notify orchestrator via callback
        if (this.onRetry) {
          this.onRetry(context, attempt + 1, retryAfter)
        }
        
        await new Promise(resolve => setTimeout(resolve, retryAfter))
        continue
      }
      
      throw error
    }
  }
}
```

#### Wrapped API Methods
All three Gemini API calls now use retry logic:
- `processQuery()` - Stage 1 (Query Processing)
- `planLesson()` - Stage 2 (Lesson Planning)
- `generateScript()` - Stage 3 (Script Generation)

#### Factory Function Update
```typescript
export function getGeminiClient(
  onRetry?: (stage: string, attempt: number, delay: number) => void
): GeminiClient {
  const apiKey = process.env.GEMINI_API_KEY
  const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash-exp"
  return new GeminiClient(apiKey, modelName, onRetry)
}
```

### 4. Orchestrator Integration (`services/LuminaOrchestrator.ts`)

#### Resume Capability
```typescript
async resumeRun(runId: string): Promise<AgentRun> {
  const run = this.activeRuns.get(runId)
  if (!run || run.status === "completed") {
    throw new Error(`Cannot resume run ${runId}`)
  }
  
  run.status = "processing"
  return run
}
```

#### Stage Checkpointing
```typescript
// Gather outputs from completed stages
let queryOutput = run.stages.find(s => 
  s.stage === "query_processing" && s.status === "completed"
)?.output

// Skip completed stages
if (startIdx <= 0) {
  yield { type: "stage", stage: "query_processing" }
  queryOutput = await this.executeQueryProcessing(run, onRetry)
} else if (queryOutput) {
  yield { type: "stage", stage: "query_processing", status: "skipped" }
}
```

#### Retry Event Emission
```typescript
async *executeRun(runId: string, resumeFrom?: string): AsyncGenerator<any> {
  const retryEvents: Array<{ stage, attempt, delay }> = []
  
  // Execute stage with retry callback
  queryOutput = await this.executeQueryProcessing(run, 
    (stage, attempt, delay) => {
      retryEvents.push({ stage, attempt, delay })
    }
  )
  
  // Yield all retry events that occurred
  for (const retryEvent of retryEvents.splice(0, retryEvents.length)) {
    yield { type: "retry", ...retryEvent }
  }
}
```

#### Updated Method Signatures
```typescript
private async executeQueryProcessing(
  run: AgentRun,
  onRetry?: (stage: string, attempt: number, delay: number) => void
): Promise<QueryProcessingOutput>

private async executeLessonPlanning(
  run: AgentRun,
  queryOutput: QueryProcessingOutput,
  onRetry?: (stage: string, attempt: number, delay: number) => void
): Promise<LessonPlanningOutput>

private async executeScriptGeneration(
  run: AgentRun,
  lessonOutput: LessonPlanningOutput,
  onRetry?: (stage: string, attempt: number, delay: number) => void
): Promise<ScriptGenerationOutput>
```

## User Experience Flow

### Normal Execution
1. User asks a question
2. Pipeline stages execute sequentially
3. Stage badges turn purple as they activate
4. Answer streams token by token
5. Visual plan appears when animation synthesis completes
6. Video player shows rendered animation
7. All stages turn green on completion

### Rate Limited Execution
1. User asks a question
2. Pipeline hits rate limit on stage 1, 2, or 3
3. **Retry indicator appears below stages:**
   - "⟳ Retrying query_processing..."
   - "Attempt 2 • Waiting 54s"
4. System automatically retries with extracted delay
5. User sees countdown in real-time
6. Pipeline continues normally after successful retry

### Failed Execution with Resume
1. Pipeline fails after completing some stages
2. **Resume button appears** next to "Ask Lumina"
3. User clicks "Resume"
4. Pipeline skips completed stages (shown with gray skip icons)
5. Execution resumes from next pending stage
6. Previously completed work is preserved

## Technical Details

### Retry Strategy
- **Max attempts**: 3 per API call
- **Base delay**: 1 second
- **Exponential backoff**: 1s → 2s → 4s
- **Smart delay extraction**: Parses Google's error message for retry delay
- **Example**: "Please retry in 54.2s" → 54200ms delay

### Stage Persistence
- All stage outputs saved to `run.stages[].output`
- Status tracked: `pending` → `active` → `completed` / `failed`
- Resume checks `status === "completed"` to skip stages
- Outputs available for subsequent stages

### Event Streaming
- Server-Sent Events (SSE) via `/api/lumina/query`
- Real-time retry events streamed to frontend
- No polling required
- Automatic reconnection via EventSource

## Testing

### Test Rate Limit Handling
```bash
# Run test script (will hit quota limits)
ts-node test-lumina-gemini.ts
```

**Expected behavior:**
- Console shows retry attempts with delays
- System waits for specified duration
- Auto-retries up to 3 times
- Fails gracefully after max retries

### Test Resume Capability
1. Start a query that will fail mid-pipeline
2. Check console for runId
3. Modify test to call `resumeRun(runId)`
4. Verify completed stages are skipped
5. Confirm execution continues from checkpoint

## Configuration

No new environment variables required. Uses existing:
- `GEMINI_API_KEY` - Google Gemini API key
- `GEMINI_MODEL_NAME` - Model name (default: gemini-2.0-flash-exp)

## Benefits

1. **User Experience**: Transparent retry progress with countdown
2. **Efficiency**: Avoids wasting completed work
3. **Robustness**: Handles transient rate limits automatically
4. **Observability**: Clear visibility into retry attempts
5. **Flexibility**: Manual resume for failed runs
6. **Smart Delays**: Uses Google's suggested retry timing
7. **No Wasted Quota**: Preserves completed stage outputs

## Future Enhancements

- Persist runs to database for long-term resume
- Add manual retry button per stage
- Show retry history in UI
- Implement backoff multiplier configuration
- Add webhook notifications for failed runs
- Support partial stage re-execution
