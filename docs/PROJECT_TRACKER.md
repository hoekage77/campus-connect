# Campus Connect — Project Tracker

**Project Start Date:** November 10, 2025  
**Target MVP Completion:** November 24, 2025 (2 weeks)  
**Team Size:** 1-3 developers  
**Status:** 🟡 Planning Phase

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Total Tasks** | 47 |
| **Completed** | 2 |
| **In Progress** | 0 |
| **Not Started** | 45 |
| **Blocked** | 0 |
| **Progress** | 4% |

---

## Phase Overview

| Phase | Status | Tasks | Est. Days | Start Date | End Date |
|-------|--------|-------|-----------|------------|----------|
| Phase 0: Setup | 🟡 In Progress | 6 | 1-2 | Nov 10 | Nov 12 |
| Phase 1: Core MVP | 🔴 Not Started | 13 | 4-8 | Nov 13 | Nov 20 |
| Phase 2: E2EE | 🔴 Not Started | 8 | 3-6 | Nov 21 | Nov 26 |
| Phase 3: Real-time | 🔴 Not Started | 11 | 3-7 | Nov 27 | Dec 3 |
| Phase 4: Testing & Deploy | 🔴 Not Started | 9 | 2-4 | Dec 4 | Dec 7 |
| Phase 5: Stretch | ⚪ Future | TBD | Variable | TBD | TBD |

---

## Phase 0: Setup & Infrastructure
**Goal:** Set up development environment, tools, and project structure  
**Status:** 🟡 In Progress (29% complete)  
**Timeline:** Nov 10 - Nov 12 (1-2 days)

### Tasks
- [x] **P0.1** Create project specification document
  - Assignee: —
  - Completed: Nov 10, 2025
  - Notes: Comprehensive spec with E2EE architecture

- [ ] **P0.2** Initialize Next.js project with TypeScript
  - Assignee: —
  - Priority: High
  - Blockers: None
  - Acceptance Criteria: Next.js 14+ app created with TypeScript, App Router enabled

- [ ] **P0.3** Install and configure shadcn/ui + Tailwind CSS
  - Assignee: —
  - Priority: High
  - Depends on: P0.2
  - Acceptance Criteria: shadcn/ui initialized, first components installed (Button, Card)

- [ ] **P0.4** Setup Prisma with PostgreSQL
  - Assignee: —
  - Priority: High
  - Depends on: P0.2
  - Acceptance Criteria: Prisma initialized, connection tested, initial schema defined

- [ ] **P0.5** Configure NextAuth (Auth.js v5)
  - Assignee: —
  - Priority: High
  - Depends on: P0.2, P0.4
  - Acceptance Criteria: NextAuth configured with credentials + Google OAuth

- [ ] **P0.6** Setup project structure and folder organization
  - Assignee: —
  - Priority: Medium
  - Depends on: P0.2
  - Acceptance Criteria: Folders created for components, lib, types, hooks, utils

- [x] **P0.7** Add shadcn MCP server for development
  - Assignee: —
  - Priority: Medium
  - Completed: Nov 10, 2025
  - Notes: MCP server configured in .vscode/mcp.json

---

## Phase 1: Core MVP (No E2EE)
**Goal:** Build core features with basic transport encryption  
**Status:** 🔴 Not Started (0% complete)  
**Timeline:** Nov 13 - Nov 20 (4-8 days)

### Tasks

#### Authentication (2-3 days)
- [ ] **P1.1** Implement user registration with email
  - Assignee: —
  - Priority: High
  - Depends on: P0.5
  - Acceptance Criteria: Users can sign up with email/password

- [ ] **P1.2** Implement OAuth login (Google)
  - Assignee: —
  - Priority: High
  - Depends on: P1.1
  - Acceptance Criteria: Users can sign in with Google account

- [ ] **P1.3** Create user profile page
  - Assignee: —
  - Priority: Medium
  - Depends on: P1.1
  - Acceptance Criteria: Profile shows name, email, topics; edit functionality

#### Groups & Sessions (2-3 days)
- [ ] **P1.4** Design and implement Group data model (Prisma)
  - Assignee: —
  - Priority: High
  - Depends on: P0.4
  - Acceptance Criteria: Group schema with title, description, privacy, topics

- [ ] **P1.5** Create group creation form
  - Assignee: —
  - Priority: High
  - Depends on: P1.4
  - Acceptance Criteria: User can create public/private group with metadata

- [ ] **P1.6** Build group detail page
  - Assignee: —
  - Priority: High
  - Depends on: P1.4
  - Acceptance Criteria: Shows group info, members, join button

- [ ] **P1.7** Implement group join/invite flow
  - Assignee: —
  - Priority: High
  - Depends on: P1.6
  - Acceptance Criteria: Users can join public groups, receive invites for private

- [ ] **P1.8** Design and implement Session data model
  - Assignee: —
  - Priority: High
  - Depends on: P0.4
  - Acceptance Criteria: Session schema with time, location, capacity, RSVPs

- [ ] **P1.9** Create session creation form
  - Assignee: —
  - Priority: High
  - Depends on: P1.8
  - Acceptance Criteria: User can create one-time hangout with details

- [ ] **P1.10** Build session detail page
  - Assignee: —
  - Priority: High
  - Depends on: P1.8
  - Acceptance Criteria: Shows session info, attendees, RSVP button

#### Discovery & Search (1-2 days)
- [ ] **P1.11** Build discovery feed (list view)
  - Assignee: —
  - Priority: High
  - Depends on: P1.4, P1.8
  - Acceptance Criteria: Shows all public groups and sessions, paginated

- [ ] **P1.12** Implement search and filter functionality
  - Assignee: —
  - Priority: Medium
  - Depends on: P1.11
  - Acceptance Criteria: Filter by topic, location, time; search by keyword

- [ ] **P1.13** Create "My Groups" page
  - Assignee: —
  - Priority: Medium
  - Depends on: P1.4
  - Acceptance Criteria: Shows groups user is member of

#### RSVP System (1 day)
- [ ] **P1.14** Implement RSVP model and API routes
  - Assignee: —
  - Priority: High
  - Depends on: P1.8
  - Acceptance Criteria: POST/GET /api/sessions/[id]/rsvps works

- [ ] **P1.15** Build RSVP UI component
  - Assignee: —
  - Priority: High
  - Depends on: P1.14
  - Acceptance Criteria: Users can RSVP yes/no/maybe, see attendee list

#### Basic Chat (1-2 days, no E2EE yet)
- [ ] **P1.16** Implement Message data model
  - Assignee: —
  - Priority: High
  - Depends on: P0.4
  - Acceptance Criteria: Message schema with senderId, content, groupId

- [ ] **P1.17** Build basic chat UI
  - Assignee: —
  - Priority: High
  - Depends on: P1.16
  - Acceptance Criteria: Send/receive messages in group, simple bubble UI

- [ ] **P1.18** Add API routes for messages
  - Assignee: —
  - Priority: High
  - Depends on: P1.16
  - Acceptance Criteria: POST/GET /api/messages works, stores plaintext (temp)

---

## Phase 2: Client-Side E2EE
**Goal:** Replace plaintext messages with end-to-end encryption  
**Status:** 🔴 Not Started (0% complete)  
**Timeline:** Nov 21 - Nov 26 (3-6 days)

### Tasks

#### Key Infrastructure (2-3 days)
- [ ] **P2.1** Install and configure libsodium-wrappers
  - Assignee: —
  - Priority: High
  - Blockers: None
  - Acceptance Criteria: Library installed, ready callback working

- [ ] **P2.2** Implement identity keypair generation
  - Assignee: —
  - Priority: High
  - Depends on: P2.1
  - Acceptance Criteria: Generate X25519 keypair on signup, store securely

- [ ] **P2.3** Build secure key storage system
  - Assignee: —
  - Priority: High
  - Depends on: P2.2
  - Acceptance Criteria: Private key encrypted with password-derived key, stored in IndexedDB

- [ ] **P2.4** Implement group symmetric key generation
  - Assignee: —
  - Priority: High
  - Depends on: P2.2
  - Acceptance Criteria: Random 256-bit key generated for each group

- [ ] **P2.5** Build key envelope system (encrypt group key for each member)
  - Assignee: —
  - Priority: High
  - Depends on: P2.4
  - Acceptance Criteria: Group key encrypted with each member's public key

#### Message Encryption (2-3 days)
- [ ] **P2.6** Implement client-side message encryption
  - Assignee: —
  - Priority: High
  - Depends on: P2.4, P2.5
  - Acceptance Criteria: Messages encrypted with XChaCha20-Poly1305 before sending

- [ ] **P2.7** Implement client-side message decryption
  - Assignee: —
  - Priority: High
  - Depends on: P2.6
  - Acceptance Criteria: Received messages decrypted locally, displayed as plaintext

- [ ] **P2.8** Update message API to handle ciphertext
  - Assignee: —
  - Priority: High
  - Depends on: P2.6
  - Acceptance Criteria: API stores ciphertext + IV only, never sees plaintext

#### Attachments & UI (1-2 days)
- [ ] **P2.9** Implement encrypted attachment upload
  - Assignee: —
  - Priority: Medium
  - Depends on: P2.6
  - Acceptance Criteria: Files encrypted client-side, ciphertext uploaded to storage

- [ ] **P2.10** Implement encrypted attachment download
  - Assignee: —
  - Priority: Medium
  - Depends on: P2.9
  - Acceptance Criteria: Download ciphertext, decrypt client-side, display/download

- [ ] **P2.11** Build key backup/export UI
  - Assignee: —
  - Priority: High
  - Depends on: P2.3
  - Acceptance Criteria: Users can export encrypted key backup file

- [ ] **P2.12** Display encryption indicators in UI
  - Assignee: —
  - Priority: Medium
  - Depends on: P2.6
  - Acceptance Criteria: Lock icon on encrypted chats, fingerprint display

---

## Phase 3: Real-time & Polish
**Goal:** Add real-time features, notifications, and moderation  
**Status:** 🔴 Not Started (0% complete)  
**Timeline:** Nov 27 - Dec 3 (3-7 days)

### Tasks

#### Real-time Communication (2-3 days)
- [ ] **P3.1** Install and configure Socket.io
  - Assignee: —
  - Priority: High
  - Blockers: None
  - Acceptance Criteria: Socket.io server running, client connected

- [ ] **P3.2** Implement real-time message delivery
  - Assignee: —
  - Priority: High
  - Depends on: P3.1
  - Acceptance Criteria: Messages appear instantly without refresh

- [ ] **P3.3** Add typing indicators
  - Assignee: —
  - Priority: Low
  - Depends on: P3.1
  - Acceptance Criteria: "User is typing..." shown to other members

- [ ] **P3.4** Add online presence indicators
  - Assignee: —
  - Priority: Low
  - Depends on: P3.1
  - Acceptance Criteria: Green dot shows who's online

#### Notifications (1-2 days)
- [ ] **P3.5** Implement in-app notification system
  - Assignee: —
  - Priority: Medium
  - Blockers: None
  - Acceptance Criteria: Toast notifications for new messages (metadata only)

- [ ] **P3.6** Setup email notifications for RSVPs and invites
  - Assignee: —
  - Priority: Low
  - Blockers: Need email service (Resend or SendGrid)
  - Acceptance Criteria: Emails sent on RSVP and group invite

#### Map View (2-3 days)
- [ ] **P3.7** Install and configure Mapbox or Leaflet
  - Assignee: —
  - Priority: Medium
  - Blockers: None
  - Acceptance Criteria: Map library installed, basic map rendering

- [ ] **P3.8** Build map view for discovery
  - Assignee: —
  - Priority: Medium
  - Depends on: P3.7
  - Acceptance Criteria: Sessions shown as markers on map, clickable

- [ ] **P3.9** Add location autocomplete for session creation
  - Assignee: —
  - Priority: Low
  - Depends on: P3.7
  - Acceptance Criteria: Search campus locations, select from suggestions

#### Moderation & Safety (1-2 days)
- [ ] **P3.10** Build report submission flow
  - Assignee: —
  - Priority: Medium
  - Blockers: None
  - Acceptance Criteria: Users can report messages/users with optional plaintext copy

- [ ] **P3.11** Implement basic moderation tools
  - Assignee: —
  - Priority: Medium
  - Depends on: P3.10
  - Acceptance Criteria: Group owners can remove members, view reports

#### Responsive Design (1 day)
- [ ] **P3.12** Mobile responsive layout
  - Assignee: —
  - Priority: High
  - Blockers: None
  - Acceptance Criteria: All pages work well on mobile (320px+)

---

## Phase 4: Testing & Deployment
**Goal:** Test thoroughly and deploy to production  
**Status:** 🔴 Not Started (0% complete)  
**Timeline:** Dec 4 - Dec 7 (2-4 days)

### Tasks

#### Testing (2-3 days)
- [ ] **P4.1** Write unit tests for encryption functions
  - Assignee: —
  - Priority: High
  - Blockers: None
  - Acceptance Criteria: 90%+ coverage on crypto utils, all tests pass

- [ ] **P4.2** Write integration tests for auth flow
  - Assignee: —
  - Priority: High
  - Blockers: None
  - Acceptance Criteria: Signup → login → profile update tested

- [ ] **P4.3** Write integration tests for group creation and messaging
  - Assignee: —
  - Priority: High
  - Blockers: None
  - Acceptance Criteria: Create group → invite → send encrypted message tested

- [ ] **P4.4** Write E2E test for complete user journey
  - Assignee: —
  - Priority: Medium
  - Blockers: None
  - Acceptance Criteria: Playwright test covers signup → group → chat → RSVP

- [ ] **P4.5** Security audit: verify server cannot decrypt messages
  - Assignee: —
  - Priority: High
  - Blockers: None
  - Acceptance Criteria: Inspect DB and network traffic, confirm only ciphertext

#### Performance & Optimization (1 day)
- [ ] **P4.6** Performance optimization (lazy loading, code splitting)
  - Assignee: —
  - Priority: Medium
  - Blockers: None
  - Acceptance Criteria: Lighthouse score >90, bundle size optimized

- [ ] **P4.7** Accessibility audit (WCAG 2.1 AA)
  - Assignee: —
  - Priority: Medium
  - Blockers: None
  - Acceptance Criteria: axe-core scan passes, keyboard navigation works

#### Deployment (1 day)
- [ ] **P4.8** Deploy to Vercel/Railway
  - Assignee: —
  - Priority: High
  - Blockers: Database setup
  - Acceptance Criteria: App accessible at production URL

- [ ] **P4.9** Setup CI/CD pipeline (GitHub Actions)
  - Assignee: —
  - Priority: Medium
  - Blockers: None
  - Acceptance Criteria: Auto-deploy on merge to main, tests run on PR

#### Documentation (1 day)
- [ ] **P4.10** Write comprehensive README
  - Assignee: —
  - Priority: High
  - Blockers: None
  - Acceptance Criteria: Setup instructions, architecture diagram, API docs

---

## Phase 5: Stretch Features (Future)
**Goal:** Advanced features beyond MVP  
**Status:** ⚪ Future  
**Timeline:** TBD

### Potential Tasks
- Multi-device key sync
- Polls in groups
- Calendar export (.ics)
- Advanced group ratchet (Megolm) for forward secrecy
- PWA offline support
- Advanced moderation dashboard
- Message reactions and threads
- Voice/video calls (WebRTC)

---

## Risk Register

| Risk ID | Risk | Impact | Probability | Mitigation | Owner | Status |
|---------|------|--------|-------------|------------|-------|--------|
| R1 | Scope creep beyond MVP | High | Medium | Strict MVP definition, phase gates | Team | Active |
| R2 | E2EE complexity delays timeline | High | Medium | Allocate extra time, reference implementations | Dev | Active |
| R3 | Key loss by users | High | High | Clear UX warnings, easy backup flow | Dev | Active |
| R4 | Performance issues with encryption | Medium | Low | Optimize crypto operations, Web Workers | Dev | Monitoring |
| R5 | Browser compatibility issues | Medium | Low | Test on major browsers, polyfills | Dev | Monitoring |
| R6 | Database setup delays | Medium | Low | Use Supabase for quick setup | Ops | Active |
| R7 | Learning curve for team | Medium | Medium | Pair programming, documentation | Team | Active |

---

## Blockers & Dependencies

### Current Blockers
- None (Phase 0 in progress)

### Upcoming Dependencies
- Phase 1 depends on: Phase 0 completion
- Phase 2 depends on: Phase 1 messaging system
- Phase 3 depends on: Phase 2 E2EE working
- Phase 4 depends on: Phase 3 feature complete

---

## Meeting Notes & Decisions

### Nov 10, 2025 - Kickoff
- **Decision:** Use shadcn/ui for consistent, accessible UI components
- **Decision:** Implement E2EE from start (client-side encryption mandatory)
- **Decision:** Use libsodium-wrappers for crypto operations
- **Decision:** Target 2-week MVP timeline
- **Action:** Create project spec and tracker documents ✅
- **Action:** Setup shadcn MCP server for development ✅
- **Action:** Create comprehensive agent instructions ✅

---

## Resource Links

### Documentation
- [Project Specification](./PROJECT_SPEC.md)
- [Agent Instructions](./AGENT_INSTRUCTIONS.md)
- Database Schema: TBD
- API Documentation: TBD

### External Resources
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [libsodium Docs](https://libsodium.gitbook.io/doc/)
- [Prisma Docs](https://www.prisma.io/docs)

### Tools
- **Repo:** TBD (GitHub)
- **Deployment:** Vercel (TBD)
- **Database:** Supabase or Railway (TBD)
- **Project Board:** This tracker

---

## Team

| Role | Name | Responsibilities |
|------|------|------------------|
| Project Lead | TBD | Overall coordination, decisions |
| Frontend Dev | TBD | UI/UX, React components, E2EE client |
| Backend Dev | TBD | API routes, database, auth |
| DevOps | TBD | Deployment, CI/CD, monitoring |

---

## Daily Standup Template

**Date:**  
**Team Member:**

**Yesterday:**
- What did you complete?
- Blocked by anything?

**Today:**
- What will you work on?
- Any blockers expected?

**Notes:**
- Any decisions needed?
- Any help needed?

---

## Sprint Planning Template

**Sprint:** [Number]  
**Dates:** [Start] - [End]  
**Goal:** [Sprint goal]

**Committed Tasks:**
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Stretch Tasks:**
- [ ] Task 4

**Sprint Review:**
- Completed:
- Incomplete:
- Learnings:
- Next sprint focus:

---

**Last Updated:** November 10, 2025  
**Next Review:** November 12, 2025
