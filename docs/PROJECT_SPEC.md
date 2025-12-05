# Campus Connect — Social Study & Hangout Platform

## Project Overview

**One-line summary:** A web app where students can create and join study groups or casual hangout sessions, schedule events, discover nearby campus meetups, and securely message each other — with message content end-to-end encrypted (E2EE) so servers never see plaintext.

**Project goals:**
- Allow discovery of study groups and casual hangouts on campus
- Support event scheduling, RSVPs, and lightweight group management
- Provide secure, private messaging using client-side encryption
- Keep a simple MVP that can be extended with real-time features and moderation tools

**Contract:**
- **Inputs:** User accounts (email/password or OAuth), group/session metadata (title, description, time, location), messages (text, media), RSVPs
- **Outputs:** Lists of public/group events, encrypted messages stored on server, notification triggers (metadata only)
- **Success criteria:** Users can create/join a group or session, schedule an event, and exchange encrypted messages that the server cannot decrypt. MVP should be deployable in ~1–2 weeks (team of 1–3)

---

## Key User Stories

- As a student, I can discover nearby study groups and hangouts by location, subject, or time
- As a user, I can create a group or single-session hangout (public or private) and invite others
- As a member, I can send messages and attachments to the group; the messages are end-to-end encrypted
- As an event creator, I can schedule time/place, set max attendees, and view RSVPs
- As a user, I can report abusive messages; moderators see metadata (not necessarily plaintext)
- As a user, I can back up/restore my encryption keys (optional)

---

## Core Features (Full System)

### Authentication & Profiles
- Email/password or OAuth (Google, GitHub) authentication
- User profiles with basic info (name, year, major, topics of interest)
- Public key management for E2EE

### Groups & Sessions
- **Groups** (persistent): Topics, members, message history, pinned items
- **Sessions** (one-time hangouts): Time-window, location, host, RSVP, optional ephemeral chat
- Privacy levels: Public / Invite-only / Private (by link)
- Event scheduling with time, location (map integration), capacity, and RSVP flow

### Discovery
- Discovery feed showing public groups and sessions
- Map view with filters (time, subject, distance)
- Search by topic, location, or time
- Campus zone/building-based location tags

### Messaging (E2EE)
- Text messages encrypted client-side
- Attachments (images, small files) encrypted before upload
- Message reactions
- Read receipts (optional; reveals metadata)
- Typing indicators and presence

### Moderation & Safety
- Report flow (user can optionally share decrypted copy)
- Role-based moderation (owner/moderator/member)
- Remove/ban users from groups
- Rate limiting and spam prevention

### Key Management
- Client-side encryption key generation
- Secure key storage (browser storage with encryption)
- Key backup/export functionality
- Key fingerprint verification

### Notifications
- Push notifications for messages (metadata only)
- Email notifications for RSVPs and invites
- In-app notification center

### Optional/Stretch Features
- Polls within groups
- Pinned messages
- Calendar export (.ics)
- Multi-device key sync
- PWA offline support

---

## MVP Features (School Project Scope)

**Phase 1 MVP (2 weeks):**
1. Auth (NextAuth with OAuth)
2. Create/join groups and sessions
3. Browse groups/sessions with search and filter
4. Basic messaging (transport TLS first, then add E2EE)
5. RSVP and attendee list
6. Simple campus location tags
7. Clean UI using shadcn/ui components

**Timeline estimate:**
- Solo dev: ~1–2 weeks for full MVP (no E2EE), ~2–4 additional days for E2EE
- Team of 2–3: Parallelize and finish in 1–2 weeks including E2EE baseline

---

## Encryption Architecture

### Approach: Client-Side End-to-End Encryption (E2EE)

Messages are encrypted on sender's device and decrypted on recipients' devices. Server stores only ciphertext and metadata.

### Cryptography Primitives & Libraries

**Recommended library:** `libsodium-wrappers` (or `tweetnacl`)

**Primitives:**
- **Asymmetric key exchange:** X25519 (Curve25519) for ECDH
- **Signing (optional):** Ed25519 for message signatures
- **Symmetric encryption:** XChaCha20-Poly1305 or AES-GCM
- **KDF:** HKDF; password-derived keys: Argon2 or PBKDF2

### Key Management

**Per-user identity keypair:**
- Private key stored encrypted on user's device (protected by password-derived key)
- Public key stored on server

**Per-conversation symmetric key:**
- Creator generates random group key (symmetric)
- Group key encrypted for each member using their public key
- On membership changes, rotate group key

**Key backup/recovery:**
- User-export encrypted private key (protected by passphrase)
- Optional cloud backup of encrypted keys
- Warning: Lost private key = lost message access

### Message Flow

**On create/join:**
1. Users generate or import identity keypair
2. Creator generates group symmetric key (random)
3. Encrypt group key for each member's public key

**Sending a message:**
1. Client encrypts message content with group symmetric key
2. Send ciphertext + metadata (sender ID, timestamp, message ID) to server

**Receiving:**
1. Client fetches encrypted group key
2. Decrypt with user's private key to get group symmetric key
3. Decrypt messages locally

**Attachments:**
- Encrypt client-side before upload
- Upload ciphertext to server or encrypted cloud storage

### Trade-offs & Limitations

**Server-side limitations:**
- No server-side full-text search of message contents
- No automated content moderation (keyword detection)
- Message previews in notifications contain no sensitive data

**UX challenges:**
- Key loss and account recovery must be carefully designed
- Multiple devices require key sync or per-device keys
- Group key rotation when membership changes

**Complexity:**
- More complex than server-side encryption
- Requires careful key management UX

---

## Data Model

### Entities

**User**
```typescript
{
  id: string
  name: string
  email: string
  publicKey: string  // Base64 encoded
  avatarUrl?: string
  year?: string
  major?: string
  topics: string[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Group**
```typescript
{
  id: string
  title: string
  description: string
  ownerId: string
  privacy: 'public' | 'invite-only' | 'private'
  topics: string[]
  location?: string
  avatarUrl?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

**GroupMember**
```typescript
{
  id: string
  groupId: string
  userId: string
  role: 'owner' | 'moderator' | 'member'
  encryptedGroupKey: string  // Encrypted with user's public key
  joinedAt: DateTime
}
```

**Session**
```typescript
{
  id: string
  title: string
  description: string
  hostId: string
  groupId?: string  // Optional: link to a group
  location: string
  startAt: DateTime
  endAt: DateTime
  capacity?: number
  privacy: 'public' | 'invite-only'
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Message**
```typescript
{
  id: string
  groupId?: string
  sessionId?: string
  senderId: string
  ciphertext: string  // Base64 encoded encrypted content
  iv: string  // Initialization vector
  metadata: {
    attachmentRefs: string[]
    replyTo?: string
  }
  createdAt: DateTime
}
```

**Attachment**
```typescript
{
  id: string
  uploaderId: string
  encryptedBlobRef: string  // S3/storage reference
  contentType: string
  size: number
  iv: string
  createdAt: DateTime
}
```

**RSVP**
```typescript
{
  id: string
  sessionId: string
  userId: string
  status: 'yes' | 'no' | 'maybe'
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Report**
```typescript
{
  id: string
  reporterId: string
  targetType: 'message' | 'user' | 'group'
  targetId: string
  reason: string
  plaintextCopy?: string  // Optional: reporter provides decrypted copy
  metadata: object
  status: 'pending' | 'reviewed' | 'resolved'
  createdAt: DateTime
}
```

---

## API Routes & Pages

### Pages (Next.js App Router)

```
/                           → Discovery feed (list + map toggle)
/groups                     → My groups / browse public groups
/groups/new                 → Create group
/groups/[id]                → Group detail (info, members, schedule)
/groups/[id]/chat           → Encrypted chat UI
/sessions/new               → Create session
/sessions/[id]              → Session detail + chat
/profile                    → User profile and key backup/restore
/settings                   → Encryption settings, notifications
/auth/signin                → Sign in
/auth/signup                → Sign up
/auth/signout               → Sign out
```

### API Endpoints

**Authentication**
```
POST   /api/auth/*          → NextAuth endpoints
POST   /api/auth/register   → User registration
```

**Groups**
```
GET    /api/groups          → List/search groups (with filters)
POST   /api/groups          → Create group
GET    /api/groups/[id]     → Get group details
PATCH  /api/groups/[id]     → Update group
DELETE /api/groups/[id]     → Delete group
```

**Group Members**
```
GET    /api/groups/[id]/members          → List members
POST   /api/groups/[id]/members          → Invite/add member
DELETE /api/groups/[id]/members/[userId] → Remove member
GET    /api/groups/[id]/keys             → Get encrypted group keys
```

**Sessions**
```
GET    /api/sessions        → List/search sessions
POST   /api/sessions        → Create session
GET    /api/sessions/[id]   → Get session details
PATCH  /api/sessions/[id]   → Update session
DELETE /api/sessions/[id]   → Delete session
```

**RSVPs**
```
GET    /api/sessions/[id]/rsvps    → List RSVPs
POST   /api/sessions/[id]/rsvps    → Create/update RSVP
```

**Messages**
```
GET    /api/messages        → List messages (with groupId or sessionId)
POST   /api/messages        → Send message (ciphertext)
DELETE /api/messages/[id]   → Delete message
```

**Attachments**
```
POST   /api/attachments     → Upload encrypted attachment
GET    /api/attachments/[id] → Download encrypted attachment
```

**Reports**
```
POST   /api/reports         → Submit report
GET    /api/reports         → List reports (moderators only)
PATCH  /api/reports/[id]    → Update report status
```

**Real-time**
- WebSocket or Server-Sent Events for message notifications and presence
- Server forwards ciphertext; client decrypts locally

---

## Tech Stack

### Core
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **UI Components:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** Prisma

### Authentication & Security
- **Auth:** NextAuth.js v5 (Auth.js)
- **Encryption:** libsodium-wrappers or tweetnacl
- **Validation:** Zod

### Data Fetching & State
- **Server State:** TanStack Query (React Query) or SWR
- **Forms:** React Hook Form
- **Date handling:** date-fns or Day.js

### Real-time & Communication
- **WebSocket:** Socket.io or Pusher
- **Alternative:** Supabase Realtime

### File Storage
- **Storage:** AWS S3, Cloudinary, or Vercel Blob
- **Upload:** Encrypted client-side before upload

### Maps & Location
- **Maps:** Mapbox GL JS or Leaflet
- **Geocoding:** Mapbox Geocoding API (optional)

### Testing & CI
- **Unit Tests:** Vitest or Jest
- **E2E Tests:** Playwright
- **Linting:** ESLint + Prettier
- **CI:** GitHub Actions

### Deployment
- **Hosting:** Vercel or Railway
- **Database:** Local SQLite/PostgreSQL initially, migrate to Supabase later

---

## Implementation Phases

### Phase 0 — Setup (1-2 days)
- [x] Project specification document
- [ ] Initialize Next.js project with TypeScript
- [ ] Install shadcn/ui and configure Tailwind
- [ ] Setup Prisma with PostgreSQL
- [ ] Configure NextAuth
- [ ] Setup project structure and folder organization

### Phase 1 — Core MVP (4-8 days)
- [ ] User authentication (email + OAuth)
- [ ] User profile pages
- [ ] Create/edit groups and sessions
- [ ] Discovery feed (list view)
- [ ] Group/session detail pages
- [ ] RSVP functionality
- [ ] Basic chat UI (transport encryption only)
- [ ] Search and filter functionality

### Phase 2 — Client-Side E2EE (3-6 days)
- [ ] Implement identity keypair generation
- [ ] Secure key storage (encrypted in browser)
- [ ] Group symmetric key creation and distribution
- [ ] Client-side message encryption/decryption
- [ ] Encrypted attachment upload/download
- [ ] Key backup/export UI
- [ ] Key fingerprint display

### Phase 3 — Real-time & Polish (3-7 days)
- [ ] WebSocket integration for real-time messages
- [ ] Typing indicators and presence
- [ ] Push notifications (metadata only)
- [ ] Email notifications for RSVPs/invites
- [ ] Map view for discovery
- [ ] Moderation tools and reporting
- [ ] Mobile responsive design

### Phase 4 — Testing & Deployment (2-4 days)
- [ ] Unit tests for encryption functions
- [ ] Integration tests for key flows
- [ ] E2E tests for user journeys
- [ ] Performance optimization
- [ ] Security audit
- [ ] Deploy to production
- [ ] Documentation and README

### Phase 5 — Stretch Features (Variable)
- [ ] Multi-device key sync
- [ ] Polls in groups
- [ ] Calendar export (.ics)
- [ ] Advanced group ratchet (Megolm)
- [ ] PWA offline support
- [ ] Advanced moderation dashboard

---

## Frontend Components (shadcn/ui)

### Core Components Needed
- **Layout:** Navigation, Sidebar, Header, Footer
- **Forms:** Input, Textarea, Select, Checkbox, Radio, DatePicker, Switch
- **Buttons:** Button, IconButton, ButtonGroup
- **Cards:** Card, CardHeader, CardContent, CardFooter
- **Dialogs:** Dialog, AlertDialog, Sheet
- **Navigation:** Tabs, Dropdown Menu, Command (search)
- **Feedback:** Toast, Alert, Badge, Skeleton, Progress
- **Data Display:** Avatar, Table, Separator, Tooltip, Accordion
- **Chat:** Custom chat message components
- **Map:** Custom map integration component

### Custom Components to Build
- **ChatMessage:** Message bubble with encryption indicator
- **GroupCard:** Display group info with member count, topics
- **SessionCard:** Display session with time, location, RSVP status
- **EncryptionBadge:** Visual indicator of E2EE status
- **KeyBackupDialog:** UI for backing up encryption keys
- **FingerprintDisplay:** Show and verify key fingerprints
- **MapView:** Interactive map with markers for sessions/groups
- **DiscoveryFeed:** Combined list/grid view with filters
- **RSVPButton:** Quick RSVP with status indicator

---

## Security Considerations

### Encryption
- ✅ Messages encrypted client-side with XChaCha20-Poly1305
- ✅ Private keys stored encrypted in browser storage
- ✅ Group keys rotated on membership changes
- ✅ Attachments encrypted before upload
- ⚠️ Key backup must be user-initiated and secure
- ⚠️ Multi-device support requires careful key sync

### Authentication
- ✅ Use NextAuth with secure session handling
- ✅ CSRF protection enabled
- ✅ Rate limiting on auth endpoints
- ✅ Email verification for new accounts
- ⚠️ Consider 2FA for sensitive operations

### Data Privacy
- ✅ Server never sees plaintext messages
- ✅ Minimal metadata collection
- ✅ User consent for data sharing in reports
- ✅ GDPR-compliant data deletion
- ⚠️ Notification content limited to metadata

### Infrastructure
- ✅ HTTPS/TLS for all connections
- ✅ Secure HTTP headers (CSP, HSTS, etc.)
- ✅ Input validation on all endpoints (Zod)
- ✅ SQL injection prevention (Prisma)
- ✅ XSS prevention (React auto-escaping)
- ⚠️ Rate limiting on all API routes
- ⚠️ DDoS protection (Vercel/Cloudflare)

---

## Testing Strategy

### Unit Tests
- Encryption/decryption functions
- Key generation and management
- Message parsing and validation
- RSVP logic
- Group membership management

### Integration Tests
- User registration and login flow
- Group creation and invitation
- Message send and receive (E2EE)
- RSVP workflow
- Key backup and restore

### E2E Tests
- Complete user journey: signup → create group → invite → chat
- Multi-user scenarios (Alice invites Bob, Bob sends encrypted message)
- Mobile responsive flows
- Error handling and edge cases

### Security Tests
- Verify server cannot decrypt messages
- Test key rotation on membership changes
- Verify encrypted attachment uploads
- Test report flow with/without plaintext copy
- Penetration testing (optional)

---

## Risks & Mitigations

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Key loss = permanent data loss | High | Clear UX warnings, easy backup flow, recovery key option |
| Multi-device key sync complexity | Medium | Start with per-device keys, add sync later |
| Performance with large groups | Medium | Pagination, lazy loading, optimize crypto operations |
| Browser compatibility | Low | Use well-supported libraries, polyfills if needed |

### Security Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Man-in-the-middle during key exchange | High | Implement key fingerprint verification |
| Compromised client code | High | Subresource integrity, CSP, code reviews |
| Metadata leakage | Medium | Minimize metadata, clear privacy policy |
| Abuse/spam | Medium | Rate limiting, CAPTCHA, email verification |

### Project Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Scope creep | High | Stick to MVP, use phased approach |
| Timeline overrun | Medium | Regular check-ins, adjust scope if needed |
| Learning curve (E2EE) | Medium | Start with tutorials, reference implementations |

---

## Open Questions & Decisions Needed

1. **Multi-device support:** Per-device keys or synced keys?
   - Recommendation: Start with per-device, add sync in Phase 5

2. **Key recovery:** Sacrificing E2EE for recovery vs. strict no-recovery?
   - Recommendation: User-controlled backup with strong warnings

3. **Group size limits:** What's the max for encrypted group chat?
   - Recommendation: Start with 50, test performance

4. **Moderation policy:** How to handle abuse with E2EE?
   - Recommendation: User-initiated plaintext sharing for reports

5. **Database choice:** Self-hosted Postgres vs. Supabase?
   - **Decision:** Start with local PostgreSQL for development, migrate to Supabase for production

6. **Real-time approach:** WebSockets vs. polling vs. SSE?
   - Recommendation: Socket.io for MVP, evaluate Supabase Realtime

7. **File size limits:** Max attachment size?
   - Recommendation: 10MB for MVP, use signed URLs for large files

---

## Success Metrics

### MVP Success Criteria
- [ ] Users can sign up and authenticate
- [ ] Users can create and join groups
- [ ] Users can create sessions and RSVP
- [ ] Users can send E2EE messages
- [ ] Messages are encrypted end-to-end (verified in tests)
- [ ] UI is responsive and accessible
- [ ] Core flows tested (unit + integration)
- [ ] Deployed and accessible online

### Post-Launch Metrics
- User registrations per week
- Active groups and sessions
- Messages sent per day
- RSVP conversion rate
- User retention (7-day, 30-day)
- Key backup adoption rate
- Report submission rate

---

## Resources & References

### Encryption & Security
- [libsodium documentation](https://libsodium.gitbook.io/doc/)
- [Signal Protocol documentation](https://signal.org/docs/)
- [Matrix Megolm specification](https://gitlab.matrix.org/matrix-org/olm/-/blob/master/docs/megolm.md)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

### Next.js & React
- [Next.js documentation](https://nextjs.org/docs)
- [shadcn/ui components](https://ui.shadcn.com/)
- [NextAuth.js documentation](https://next-auth.js.org/)
- [Prisma documentation](https://www.prisma.io/docs)

### Real-time
- [Socket.io documentation](https://socket.io/docs/)
- [Pusher documentation](https://pusher.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

### Maps
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Leaflet documentation](https://leafletjs.com/)

---

## License & Credits

**Project:** Campus Connect  
**Type:** School project (educational purposes)  
**License:** MIT (or as required by your institution)  
**Created:** November 2025

---

## Appendix: Quick Start Commands

```bash
# Initialize project
npx create-next-app@latest campus-connect --typescript --tailwind --app

# Install shadcn/ui
npx shadcn-ui@latest init

# Install dependencies
npm install @prisma/client next-auth libsodium-wrappers
npm install -D prisma

# Setup database
npx prisma init
npx prisma migrate dev --name init

# Run development server
npm run dev
```

---

**Document Version:** 1.0  
**Last Updated:** November 10, 2025  
**Status:** Ready for implementation
