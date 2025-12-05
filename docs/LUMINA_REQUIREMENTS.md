# Lumina: Intelligent Visual Learning Platform - Requirements Specification

## Vision and Value Proposition

**Mission:** Turn "I don't get it" into "That's amazing!" by transforming STEM questions into instant, personalized visual animations.

**Core Promise:** AI tutoring that makes complex concepts click through instant visual animations for math, physics, and science - blending entertainment with education to create engaging, interactive learning moments.

---

## Primary Users

1. **Students**
   - Ask questions and get visual explanations
   - Practice via interactive scenes
   - Track learning progress and mastery

2. **Educators/Group Owners**
   - Curate content and learning paths
   - See learning analytics for their groups
   - Recommend sequences and prerequisites

3. **Admin**
   - Configure guardrails and AI providers
   - Set usage caps and rate limits
   - Monitor analytics and safety flags

---

## Functional Requirements

### 1. Hero/Marketing Experience (AI Page)

**Hero Section Content:**
- **Headline:** Turn "I don't get it" into "That's amazing!"
- **Subheadline:** AI tutoring that makes complex concepts click through instant visual animations for math, physics, and science
- **Primary CTA:** "Watch AI Create Physics Magic" (opens demo animation modal)
- **Secondary CTA:** "Try Live Demo Now" (opens chat + animation workspace)

**Highlights Strip:**
- ⚡ **2.8s** — Instant Physics Animations *(From question to visual answer)*
- 🧠 **∞** — Unlimited Learning Paths *(Every student's unique journey)*
- 🎯 **100%** — Personalized Experience *(AI adapts to your learning style)*

**Theme Messaging:**
- 🎭 Entertainment meets Education
- 🧪 Experiment with Concepts
- 🎊 Celebrate Every Breakthrough

### 2. Problem/Solution Section

**Current Challenges:**
- One-size-fits-all teaching approaches
- Abstract concepts hard to visualize
- Limited personalized feedback
- Passive learning experiences
- Difficulty tracking individual progress

**Lumina Solutions:**
- Adaptive AI tutoring for each student
- Real-time visual animations
- Instant, personalized feedback
- Interactive exploration tools
- Comprehensive learning analytics

### 3. Core Platform Features

**AI Tutoring Agents**
- Natural language conversation tailored to student style and pace
- Adaptive difficulty and content recommendations
- Multi-turn dialogue with context retention

**Real-Time Animation Generation**
- Transform text queries into visual animations
- Support for math, physics, and science topics
- Progressive rendering with status feedback

**Interactive Interface**
- Unified workspace: chat + visualization canvas + control panel
- Split-view responsive layout
- Real-time parameter manipulation

**Adaptive Learning System**
- Detects learning style preferences
- Adjusts difficulty based on performance
- Recommends next topics and practice sets

### 4. Learning Engine Pipeline

**Total Target Latency:** 9s max, 6.2s average

**Stage 1: Query Processing** (Target: 0.5s)
- NLP intent classification (explanation, example, practice, visualization, step-by-step, concept-check)
- Mathematical entity extraction (equations, constants, variables, difficulty level)
- Context enrichment from student profile and session data
- Pedagogical needs analysis using Gemini 2.5 Flash

**Stage 2: Content Planning** (Target: 1.0s)
- Educational AI generates structured lesson plans
- Curriculum mapping and prerequisite checks
- Learning objective identification
- Conceptual scaffolding

**Stage 3: Script Generation** (Target: 1.5s)
- AI creates detailed storyboards and animation scripts
- Template-based generation for common topics (optimization)
- Scene graph construction with timing and transitions

**Stage 4: Animation Synthesis** (Target: 5.0s)
- Multi-library rendering system:
  - **Manim (Python)** — High-quality math/physics animations (3Blue1Brown's library)
  - **JSXGraph** — Interactive math boards
  - **Three.js** — 3D visualization
  - **D3.js** — Data visual relationships
- Server-side Manim rendering with Python subprocess execution
- GPU acceleration when available
- Progressive rendering with status updates via SSE

**Stage 5: Optimization** (Target: 1.0s)
- FFmpeg quality enhancement
- Cross-device streaming optimization
- Compression and format conversion
- Caching for frequently requested content

**Pipeline Feedback:**
- Server-Sent Events (SSE) or WebSocket for real-time stage progress
- Progressive UI updates showing current stage and timing
- Fallback mechanisms if stage timeouts occur

### 5. Natural Language to Animation Translation

**Query Type Detection:**
- Explanation queries (conceptual understanding)
- Example queries (worked problems)
- Practice queries (student attempts)
- Visualization queries (interactive models)
- Step-by-step queries (procedural breakdowns)
- Concept-check queries (assessment)

**Mathematical Entity Extraction:**
- Equations and formulas
- Constants and variables
- Units and dimensions
- Difficulty level inference

**Context Enrichment:**
- Student profile (prior knowledge, learning style)
- Current session context (topic sequence)
- Performance history (mastery levels)
- Curriculum alignment

### 6. Three-Tier Animation Strategy

**Tier 1: Template-Based (≈80% of queries)**
- Pre-built templates for common topics
- Fast rendering (1-2s total)
- Consistent visual style and quality
- Parameterized for minor variations

**Tier 2: Procedural Generation**
- Algorithmic, rule-based scene construction
- For complex problems requiring custom layouts
- Medium rendering time (3-5s)
- Deterministic and reproducible

**Tier 3: AI-Assisted Generation**
- Gemini 2.5 Flash-driven creative visualizations
- For novel or interdisciplinary cases
- Longer rendering time (4-9s)
- More experimental and exploratory

### 7. Multi-Library Animation Strategy

**Library Selection Logic:**

| Library | Use Cases | Strengths |
|---------|-----------|-----------|
| **Manim (Python)** | Physics/math scenes, calculus, geometry, animations | Cinema-quality math animations, LaTeX, 3Blue1Brown standard |
| **JSXGraph** | Interactive graphs, function plotting | Real-time interactivity, lightweight |
| **Three.js** | 3D models, spatial concepts, molecular structures | WebGL rendering, camera controls |
| **D3.js** | Data relationships, networks, flowcharts | Flexible SVG manipulation |
| **FFmpeg** | Video optimization, format conversion | Cross-platform, compression |

### 8. Interactive Learning UX

**Animation Controls:**
- Play/pause/scrub timeline
- Speed adjustment (0.5x, 1x, 2x)
- Step-through mode for procedural animations

**Interactive Parameters:**
- Toggle vectors, forces, grids, labels
- Adjust constants (mass, velocity, angle, etc.)
- Real-time recalculation and re-rendering

**Experiment Mode:**
- Change parameters and see outcomes
- Side-by-side comparison views
- "What if" scenario exploration

**Concept Checks:**
- Embedded quiz questions during animations
- Instant feedback with explanations
- Adaptive follow-up based on performance

### 9. Personalization and Analytics

**Adaptive Recommendations:**
- Next topic suggestions based on mastery
- Difficulty adjustments (easier/harder variations)
- Related concept exploration paths

**Learning Analytics Dashboard:**
- Progress tracking (topics covered, mastery levels)
- Time-on-task metrics
- Attempt outcomes and error patterns
- Conceptual gaps identification
- Predictive success modeling

---

## Non-Functional Requirements

### Performance

**Latency Targets:**
- First feedback (status update): 0.5–1.0s
- Stage 1–3 combined: <3s
- End-to-end generation: <9s (P95), 6.2s average
- Interactive parameter changes: <500ms

**Throughput:**
- Support concurrent rendering jobs (queue management)
- Cache frequently requested animations
- Pre-render common templates

### Reliability

**Graceful Degradation:**
- Fallback to simpler static diagrams if heavy rendering fails
- Template animations if procedural/AI generation times out
- Clear error messages with retry options

**Fault Tolerance:**
- Pipeline stage isolation (failure in one stage doesn't crash entire flow)
- Automatic retry with exponential backoff
- Circuit breaker for external dependencies

### Accessibility

**WCAG 2.1 AA Compliance:**
- Keyboard navigation for all controls
- ARIA labels and roles for screen readers
- Color contrast requirements met
- Captions and text explanations for animations
- Alternative text descriptions for visual content

### Safety and Moderation

**Content Moderation:**
- Prompt filtering for harmful/inappropriate queries
- Age-appropriate content curation
- Safety checks on generated animations
- Abuse detection and rate limiting

**Educational Guardrails:**
- Avoid promoting dangerous experiments
- Flag pseudoscience or misinformation
- Ethical AI use guidelines

### Privacy and Security

**Data Protection:**
- No PII leakage in queries or logs
- Server-side model calls only (API keys protected)
- Configurable data retention policies
- GDPR/FERPA compliance considerations

**Access Control:**
- Authentication required for advanced features
- Role-based permissions (student/educator/admin)
- Audit logs for admin actions

### Cost Control

**Optimization Strategies:**
- Tiered pipeline (prefer templates over AI generation)
- Aggressive caching (query → animation mapping)
- Rate limits per user/group
- Provider abstraction (switch between LLM providers)
- GPU resource scheduling and throttling

---

## Data Model (High-Level)

### Core Entities

**StudentProfile**
```typescript
{
  id: string
  interests: string[]
  level: string // beginner, intermediate, advanced
  preferences: {
    visualStyle: string
    animationSpeed: number
    notificationFrequency: string
  }
  history: LearningSession[]
}
```

**LearningSession**
```typescript
{
  sessionId: string
  userId: string
  topic: string
  timestamp: Date
  queries: Query[]
  metadata: {
    duration: number
    conceptsCovered: string[]
    masteryGained: number
  }
}
```

**Query**
```typescript
{
  id: string
  userId: string
  text: string
  type: 'explanation' | 'example' | 'practice' | 'visualization' | 'step-by-step' | 'concept-check'
  entities: {
    equations: string[]
    constants: Record<string, number>
    difficulty: number
  }
  context: Record<string, any>
  createdAt: Date
}
```

**LessonPlan**
```typescript
{
  id: string
  queryId: string
  outline: string[]
  prerequisites: string[]
  learningObjectives: string[]
  estimatedDuration: number
}
```

**Script**
```typescript
{
  id: string
  planId: string
  sceneGraph: {
    scenes: Scene[]
    transitions: Transition[]
    timings: number[]
  }
  library: 'manim' | 'jsxgraph' | 'threejs' | 'd3'
}
```

**RenderJob**
```typescript
{
  id: string
  scriptId: string
  library: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  artifacts: string[] // URLs or references
  timings: {
    queryProcessing: number
    contentPlanning: number
    scriptGeneration: number
    animationSynthesis: number
    optimization: number
    total: number
  }
  createdAt: Date
  completedAt?: Date
}
```

**AnimationAsset**
```typescript
{
  id: string
  renderJobId: string
  type: 'video' | 'canvas' | 'webgl' | 'svg'
  url: string
  metadata: {
    duration: number
    dimensions: { width: number; height: number }
    fileSize: number
    format: string
  }
}
```

**Feedback**
```typescript
{
  id: string
  sessionId: string
  type: 'concept-check' | 'practice' | 'experiment'
  itemId: string
  answer: string
  result: 'correct' | 'incorrect' | 'partial'
  score: number
  timestamp: Date
}
```

**Analytics**
```typescript
{
  userId: string
  period: { start: Date; end: Date }
  metrics: {
    queriesSubmitted: number
    animationsViewed: number
    timeOnTask: number
    conceptsMastered: string[]
    averageAttempts: number
    successRate: number
  }
}
```

---

## API Surface (First Pass)

### Query and Rendering

**POST /api/lumina/query**
- **Body:** `{ userId: string, text: string, sessionContext?: object }`
- **Response:** `{ queryId: string, streamId: string }`
- **Behavior:** Initiates pipeline; returns SSE stream for progress updates

**GET /api/lumina/query/:id/status**
- **Response:** `{ stage: string, timings: object, artifacts?: string[] }`
- **Behavior:** Poll for current status; useful for non-SSE clients

**GET /api/lumina/animation/:renderJobId**
- **Response:** Asset metadata or stream
- **Behavior:** Retrieve completed animation artifacts

### Feedback and Interaction

**POST /api/lumina/feedback**
- **Body:** `{ sessionId: string, itemId: string, answer: string, result: string }`
- **Behavior:** Record student feedback; update analytics

**POST /api/lumina/experiment**
- **Body:** `{ renderJobId: string, parameters: object }`
- **Response:** `{ newRenderJobId: string }`
- **Behavior:** Create variant animation with adjusted parameters

### Recommendations and Analytics

**GET /api/lumina/recommendations?userId=...**
- **Response:** `{ topics: string[], practice: object[], relatedConcepts: string[] }`
- **Behavior:** Personalized next-step suggestions

**GET /api/lumina/analytics/:userId**
- **Response:** Analytics object (as defined above)
- **Behavior:** Dashboard data for student/educator

### Admin Endpoints

**GET /api/lumina/admin/usage**
- **Response:** Aggregate usage, costs, query volumes
- **Behavior:** Platform-wide metrics

**GET /api/lumina/admin/safety-flags**
- **Response:** List of flagged queries/outputs
- **Behavior:** Moderation dashboard

**POST /api/lumina/admin/config**
- **Body:** `{ rateLimit: number, providers: string[], featureFlags: object }`
- **Behavior:** Update platform configuration

---

## UI Requirements for AI Page Revamp

### Hero Section
- **Layout:** Full-width hero with gradient backdrop (purple-pink-orange)
- **Headline:** Large, bold text with emoji integration
- **CTA Buttons:**
  - Primary: "Watch AI Create Physics Magic" (gradient button, opens demo modal)
  - Secondary: "Try Live Demo Now" (outline button, navigates to workspace)
- **Visual:** Background animation or static graphic showing physics concepts

### Highlights Strip
- **Cards:** 3 responsive cards (mobile: stacked, tablet: 2-col, desktop: 3-col)
- **Content:**
  - Card 1: ⚡ 2.8s instant animations
  - Card 2: 🧠 ∞ unlimited learning paths
  - Card 3: 🎯 100% personalized experience
- **Style:** Glass-morphism or bordered cards with gradient accents

### Challenge vs. Solution Section
- **Layout:** Two-column responsive (mobile: stacked)
- **Left Column:** "The Challenge in Modern Education" with bulleted list
- **Right Column:** "Lumina Solution" with matching bullets
- **Style:** Icon bullets, contrasting background colors

### Core Features Section
- **Layout:** 2x2 grid (mobile: single column)
- **Cards:**
  1. 🤖 AI Tutoring Agents
  2. 🎬 Real-Time Animation Generation
  3. 📱 Interactive Interface
  4. 🧠 Adaptive Learning System
- **Style:** Hover effects, icon + title + description format

### Pipeline Section
- **Layout:** Horizontal timeline (mobile: vertical)
- **Stages:** 5 stages with labels and target times
- **Interactive:** Live status indicator when processing a query
- **Style:** Connected nodes with animated progress bar

### Interactive Workspace (Demo Page)
- **Layout:** Split view
  - Left: Chat panel (40% width)
  - Right: Canvas (60% width)
  - Bottom: Control panel (collapsible)
- **Chat Panel:**
  - Input field with send button
  - Message history
  - Preset prompt suggestions
- **Canvas:**
  - Animation rendering area
  - Playback controls (play/pause/scrub)
  - Parameter adjustment sliders
- **Control Panel:**
  - Library selector
  - Speed control
  - Toggle options (vectors, grid, labels)

### Theming and Design System
- **Components:** Use existing Campus Connect design system (Card, Button, Badge, Skeleton, Tabs)
- **Colors:** Extend with Lumina gradient palette (purple → pink → orange)
- **Typography:** Match existing hierarchy with accent fonts for Lumina branding
- **Responsive:** Mobile-first approach; breakpoints at 640px, 768px, 1024px

---

## Performance and SLA

### Latency SLA
- **Start-of-feedback:** <1s (first status update)
- **Query processing:** <0.5s
- **Content planning:** <1.0s
- **Script generation:** <1.5s
- **Animation synthesis:** <5.0s
- **Optimization:** <1.0s
- **Total end-to-end:** <9s (P95), 6.2s average

### Success Criteria
- 95% of queries complete within 9s
- 99% uptime for query submission endpoint
- <1% error rate on rendering jobs
- Fallback activates within 2s of timeout

### Monitoring
- Real-time dashboards for stage timings
- Alerting on P95 latency breaches
- Error tracking with stack traces
- Cost monitoring per query/user

---

## Acceptance Criteria (Sample)

### Query to Animation Flow
- **Given:** A student asks "Explain projectile motion with initial velocity 20 m/s at 45 degrees"
- **When:** Query is submitted to /api/lumina/query
- **Then:**
  - Status update received within 1s
  - Animation rendered or fallback shown within 9s
  - Animation includes trajectory arc, velocity vectors, and key parameters
  - User can scrub timeline and adjust angle parameter

### Demo Experience
- **Given:** A user clicks "Try Live Demo Now"
- **When:** Workspace loads
- **Then:**
  - Chat + canvas visible within 2s
  - At least 3 preset prompts available
  - Selecting a preset triggers end-to-end pipeline successfully
  - Animation plays automatically on completion

### Interactive Parameter Adjustment
- **Given:** An animation is rendered showing pendulum motion
- **When:** User adjusts pendulum length slider
- **Then:**
  - New animation variant requested
  - Re-rendering completes within 3s (using template tier)
  - Oscillation frequency visibly changes

### Moderation and Safety
- **Given:** A user submits a disallowed prompt (e.g., "How to build a bomb")
- **When:** Query is processed
- **Then:**
  - Moderation filter blocks the query
  - Safe, helpful message returned within 1s
  - Incident logged for admin review

### Analytics Dashboard
- **Given:** An educator views their group's analytics
- **When:** Dashboard loads
- **Then:**
  - Aggregate metrics shown (queries, mastery, time-on-task)
  - Individual student progress visible (privacy-respecting)
  - Average latency and error rate displayed
  - Data refreshed within last 5 minutes

---

## Phased Roadmap

### Phase 1: UI Revamp and Static Demo (Current Sprint)
**Deliverables:**
- Revamp AI page with new hero, highlights, challenge/solution, features, pipeline sections
- Add "Watch AI Create Physics Magic" demo modal with canned animation video
- Add "Try Live Demo Now" CTA navigating to workspace shell
- Interactive workspace shell (chat + canvas) with no backend integration yet
- Static animation playback (pre-recorded sample)

**Success Criteria:**
- All sections render responsively on mobile/tablet/desktop
- CTAs functional and navigate correctly
- Demo modal plays video smoothly

### Phase 2: Pipeline Stub and SSE Integration
**Deliverables:**
- Implement /api/lumina/query with SSE-based mock pipeline
- Progressive UI updates showing stage transitions and timing
- Template-based rendering with JSXGraph for simple math plots
- Basic error handling and fallback to static diagrams

**Success Criteria:**
- SSE stream delivers stage updates within target times
- At least 3 preset queries render successfully
- Fallback activates on timeout simulation

### Phase 3: Multi-Library Rendering and Optimization
**Deliverables:**
- Integrate Manim (Python) server-side rendering for physics/math animations
- Add Three.js adapter for 3D visualizations
- Gemini 2.5 Flash Manim script generation service
- FFmpeg optimization pipeline for video output
- Caching layer for frequently requested animations
- Personalization: context enrichment from student profile

**Success Criteria:**
- End-to-end latency meets <9s P95 target
- 80% of queries use template tier (fast rendering)
- Cache hit rate >60% for common topics

### Phase 4: Adaptive Learning and Admin Tools
**Deliverables:**
- Adaptive difficulty adjustment based on performance
- Recommendations endpoint for next topics
- Learning analytics dashboard for educators
- Admin safety and usage dashboards
- Multi-turn dialogue with context retention

**Success Criteria:**
- Recommendations accuracy >75% (user-validated)
- Analytics refresh latency <5s
- Admin can configure rate limits and provider settings

---

## Dependencies and Integration Notes

### External Services
- **LLM Provider:** Google Gemini 2.5 Flash (server-side only)
  - Ultra-fast code generation (<1s)
  - Cost-effective for high-volume requests
  - 1M token context window
- **Rendering Libraries:** 
  - Manim (Python) - server-side animation generation
  - JSXGraph, Three.js, D3.js (client-side interactive visualizations)
- **Python Environment:** Python 3.8+ with Manim library installed
- **Video Processing:** FFmpeg (server-side, requires binary)
- **Storage:** S3-compatible for animation assets
- **Monitoring:** Sentry for errors, Datadog/Grafana for metrics

### Campus Connect Integration
- **Authentication:** Reuse existing user session (JWT or session cookies)
- **Notifications:** Use NotificationService for reminders and alerts
- **Levels/Achievements:** Award points for queries, mastery milestones
- **Privacy:** Align with user preferences (notification frequency, data sharing)
- **Groups:** Educator dashboards scoped to their groups/sessions

### Rendering Sandbox
- **WebGL Security:** Content Security Policy (CSP) for safe rendering
- **Worker Threads:** Offload heavy computation to prevent UI blocking
- **GPU Acceleration:** Optional; graceful CPU fallback
- **Resource Limits:** Timeout and memory caps per render job

### Environment
- **Daytona.io:** Development and staging environments
- **Production:** Vercel/Netlify for frontend; AWS/GCP for backend services
- **CI/CD:** GitHub Actions for testing and deployment
- **Feature Flags:** LaunchDarkly or custom solution for gradual rollouts

---

## Risk Assessment

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Rendering latency exceeds 9s | High | Aggressive caching, template prioritization, fallback to static |
| GPU resource contention | Medium | Queue management, CPU fallback, pre-rendering |
| LLM API rate limits | High | Local caching, provider abstraction, request batching |
| Library version conflicts | Medium | Lock dependencies, container isolation |

### User Experience Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| User expects instant results | High | Clear progress feedback, manage expectations with timing info |
| Animation quality varies | Medium | Template quality control, user feedback loop |
| Complex queries fail | Medium | Guided prompts, example library, error messaging |

### Operational Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Cost overruns (LLM/GPU) | High | Rate limiting, tiered pricing, budget alerts |
| Safety/moderation lapses | High | Multi-layer filtering, manual review queue, user reporting |
| Data privacy breach | Critical | Encryption, access controls, compliance audits |

---

## Success Metrics (3-Month Horizon)

### Engagement
- 70% of students submit at least one query per week
- 50% return to Lumina >3 times per week
- Average session duration: 12+ minutes

### Performance
- 95% of queries complete within 9s
- Cache hit rate: >60%
- Error rate: <1%

### Learning Outcomes
- 80% of students report improved understanding (self-reported survey)
- 25% reduction in "I don't get it" support tickets for covered topics
- 60% of students achieve mastery on at least 5 concepts

### Platform Health
- 99.5% uptime
- Cost per query: <$0.15
- Safety incident rate: <0.1% of queries

---

## Open Questions and Future Exploration

1. **Multi-modal Input:** Should students be able to upload images of problems (OCR)?
2. **Collaboration:** Can multiple students explore the same animation together (shared session)?
3. **Voice Interaction:** Voice-to-animation pipeline for accessibility?
4. **Offline Mode:** Pre-download animations for low-connectivity scenarios?
5. **Gamification:** Badges, challenges, leaderboards for mastery milestones?
6. **Educator Authoring:** Allow educators to create custom animation templates?
7. **Assessment Integration:** Link Lumina mastery to grading systems?
8. **Language Support:** Internationalization (i18n) for non-English students?

---

## Conclusion

Lumina represents a paradigm shift in how students engage with complex STEM concepts. By combining cutting-edge AI with real-time visual generation, we transform abstract learning into intuitive, interactive experiences. This requirements document provides a comprehensive foundation for implementation, balancing ambition with pragmatic phasing and risk mitigation.

**Next Steps:**
1. Finalize Phase 1 UI revamp and static demo
2. Set up development environment on Daytona.io
3. Implement SSE pipeline stub for real-time feedback
4. Begin template library creation for high-frequency topics

**Document Maintenance:**
- Owner: XpathEdge Product Team
- Last Updated: 13 November 2025
- Review Cadence: End of each phase, or as major requirements evolve
- Change Log: Track version history in git commits

---

*Prepared by: Campus Connect + Lumina Integration Team*
*For: XpathEdge Product Development*
