# 🎯 BACKEND DEVELOPMENT ROADMAP - Campus Connect Squad App

**Created:** November 11, 2025  
**Phase:** 1B-1C (Frontend UI + Backend API)  
**Progress:** 70% Complete  

---

## 📍 WHERE WE ARE NOW

### ✅ COMPLETE (Foundation Ready)
```
✓ User Authentication System
✓ Data Store with 12 Collections
✓ User Leveling System (Data Model)
✓ Chat Rooms System (Data Model)
✓ Notifications System (Data Model)
✓ WebSocket Server for Real-time
✓ Dashboard UI with 8 Cards
✓ Sidebar Navigation
✓ Service Layer Classes (4 classes, 100+ methods)
✓ Documentation (67+ pages)
```

### 🔴 CRITICAL - BLOCKS EVERYTHING
```
❌ Chat API Endpoints (2-3 hours)
   └─ /api/chat/rooms
   └─ /api/chat/[roomId]/messages

❌ Level & Activity API (2-3 hours)
   └─ /api/users/[id]/level/stats
   └─ /api/users/[id]/activity
   └─ /api/leaderboard

❌ Preferences API (1-2 hours)
   └─ /api/users/[id]/preferences
```

### ⏳ MEDIUM PRIORITY
```
⏳ Dashboard Settings Page (2-3 hours)
⏳ Dashboard Profile Page (2-3 hours)
⏳ Chat UI Integration (3-4 hours)
```

---

## 🚀 RECOMMENDED DEVELOPMENT PATH

### Phase 1: Backend APIs (Today) - 6-8 hours
**Goal: Get all data flowing from backend**

#### Step 1.1: Chat API Routes (2-3 hours) ⭐ START HERE
```typescript
// Priority: HIGHEST
// Why: Unblocks chat functionality, all data ready in DataStore

Files to create:
├─ /src/app/api/chat/rooms/route.ts
│  └─ GET: List rooms by groupId
│  └─ POST: Create new room
│
└─ /src/app/api/chat/[roomId]/messages/route.ts
   └─ GET: Fetch messages (paginated)
   └─ POST: Send message (auto-tracks activity)

Time: 2-3 hours
Complexity: Medium
Value: HIGH
```

**Code Template Ready:** See `COPY_PASTE_API_ROUTES.ts`

#### Step 1.2: Level & Activity APIs (2-3 hours)
```typescript
// Priority: HIGH
// Why: Enables gamification display and leaderboards

Files to create:
├─ /src/app/api/users/[id]/level/stats/route.ts
│  └─ GET: User level + progress + rank
│
├─ /src/app/api/users/[id]/activity/route.ts
│  └─ POST: Track activity (message, event, etc.)
│
├─ /src/app/api/leaderboard/route.ts
│  └─ GET: Global leaderboard
│
└─ /src/app/api/interests/route.ts
   └─ GET: List available interests

Time: 2-3 hours
Complexity: Low-Medium
Value: HIGH
```

**Code Template Ready:** See `COPY_PASTE_API_ROUTES.ts`

#### Step 1.3: Preferences API (1-2 hours)
```typescript
// Priority: MEDIUM
// Why: Enables settings page

Files to create:
└─ /src/app/api/users/[id]/preferences/route.ts
   └─ GET: Fetch user preferences
   └─ PUT: Update preferences

Time: 1-2 hours
Complexity: Low
Value: MEDIUM
```

**Code Template Ready:** See `COPY_PASTE_API_ROUTES.ts`

### Phase 2: Frontend Pages (Next 4-5 hours)
**Goal: Complete sidebar navigation**

#### Step 2.1: Dashboard Settings Page (2-3 hours)
```
What it shows:
├─ User preferences form
├─ Interest selection (multi-select)
├─ Notification frequency setting
├─ Privacy settings
└─ Account settings

Uses APIs:
├─ GET /api/users/[id]/preferences
├─ GET /api/interests
└─ PUT /api/users/[id]/preferences
```

#### Step 2.2: Dashboard Profile Page (2-3 hours)
```
What it shows:
├─ User info (editable)
├─ Level badge + progress
├─ Total statistics
├─ Achievement showcase
├─ Edit profile form
└─ Delete account option

Uses APIs:
├─ GET /api/users/[id]
├─ GET /api/users/[id]/level/stats
├─ GET /api/leaderboard (for rank)
└─ PUT /api/users/[id] (for editing)
```

### Phase 3: Frontend Chat Integration (3-4 hours)
**Goal: Show real-time chat working**

#### Step 3.1: Chat UI Components
```
Components needed:
├─ ChatRoomTabs (show #general, #resources)
├─ MessageList (display messages with badges)
├─ MessageInput (send messages)
├─ MemberList (show room members)
└─ TypingIndicator (show who's typing)

Uses APIs:
├─ GET /api/chat/rooms?groupId=...
├─ GET /api/chat/[roomId]/messages
├─ POST /api/chat/[roomId]/messages
├─ WebSocket subscriptions
└─ User level badges
```

---

## 📊 TIME ESTIMATE TO FULL LAUNCH

| Task | Time | Priority | Blocking |
|------|------|----------|----------|
| Chat API | 2-3h | 🔴 CRITICAL | Chat UI |
| Level API | 2-3h | 🔴 CRITICAL | Gamification |
| Preferences API | 1-2h | 🟡 MEDIUM | Settings page |
| Settings Page | 2-3h | 🟡 MEDIUM | Sidebar complete |
| Profile Page | 2-3h | 🟡 MEDIUM | Sidebar complete |
| Chat UI | 3-4h | 🟢 LOW | Real-time demo |
| **TOTAL** | **13-18h** | - | - |

**If focusing on backend only: 5-8 hours to full API coverage**

---

## 🛠️ DEVELOPER TOOLING

### Files You Need:

1. **Service Layer** (Already Created)
   ```
   /src/services/index.ts
   └─ ChatService (5 methods)
   └─ LevelService (6 methods)
   └─ PreferencesService (5 methods)
   └─ NotificationService (4 methods)
   ```

2. **Code Templates** (Ready to Copy)
   ```
   COPY_PASTE_API_ROUTES.ts
   └─ 7 complete API route files
   └─ Copy each one to your project
   ```

3. **Testing Guide** (Included)
   ```
   API_ROUTES_GUIDE.md
   └─ curl examples for each endpoint
   └─ Request/response formats
   └─ Error handling examples
   ```

4. **Status Reference**
   ```
   TIMELINE_AND_STATUS.md
   └─ Full project breakdown
   └─ Phases and milestones
   └─ Progress tracking
   ```

### How to Use Templates:

1. Open `COPY_PASTE_API_ROUTES.ts`
2. Copy each file content
3. Create the corresponding route file
4. Paste the code
5. Test with curl or Postman
6. Connect to frontend

**No modification needed - just copy and paste!**

---

## 🧪 TESTING CHECKLIST

After building APIs, test each:

```bash
# 1. Chat Rooms
✓ GET /api/chat/rooms?groupId=X
✓ POST /api/chat/rooms (create room)

# 2. Chat Messages  
✓ POST /api/chat/[roomId]/messages (send)
✓ GET /api/chat/[roomId]/messages (fetch)
✓ Verify activity points tracked (+1)

# 3. Level Stats
✓ GET /api/users/[id]/level/stats
✓ Verify progress calculated
✓ Verify rank returned

# 4. Activity Tracking
✓ POST /api/users/[id]/activity (track activity)
✓ Verify points added
✓ Verify level updated if threshold crossed

# 5. Leaderboard
✓ GET /api/leaderboard
✓ Verify sorted by points
✓ Verify limit working

# 6. Preferences
✓ GET /api/users/[id]/preferences
✓ PUT /api/users/[id]/preferences (update)
✓ Verify interests saved

# 7. Interests
✓ GET /api/interests
✓ Verify list returned
```

---

## 💡 KEY ARCHITECTURE DECISIONS

### Why Services Layer?
- ✅ Separation of concerns (API routes stay thin)
- ✅ Reusable business logic
- ✅ Easy to test
- ✅ Easy to migrate to database later

### Why DataStore Methods?
- ✅ All persistence logic centralized
- ✅ Easy to swap implementations (API → Database)
- ✅ Consistent data access patterns
- ✅ Demo data works immediately

### Why WebSocket?
- ✅ Real-time chat without polling
- ✅ Better scalability
- ✅ Foundation for notifications
- ✅ Already implemented on server

---

## 🎯 TODAY'S ACTION PLAN

**If you have 3 hours:**
→ Build Chat API Routes (1.1)
→ Test with curl
→ Celebrate working chat! 🎉

**If you have 6 hours:**
→ Build Chat API (1.1) + 2-3 hours
→ Build Level API (1.2) + 2-3 hours
→ Test all endpoints

**If you have 8 hours:**
→ Build all 3 APIs (Chat, Level, Prefs)
→ Test all endpoints
→ Update WebSocket for chat events

---

## 📚 DOCUMENTATION FLOW

Read in this order:

1. **STATUS_SNAPSHOT.md** (current status)
2. **TIMELINE_AND_STATUS.md** (detailed timeline)
3. **COPY_PASTE_API_ROUTES.ts** (implementation)
4. **API_ROUTES_GUIDE.md** (testing guide)
5. **2GO_INTEGRATION_PLAN.md** (feature specs)

---

## ✨ NEXT IMMEDIATE STEPS

### Right Now (Choose One):

**Option A: Quick Backend Win** (3 hours)
```bash
1. Create /src/app/api/chat/rooms/route.ts
2. Create /src/app/api/chat/[roomId]/messages/route.ts
3. Test with curl
4. Result: Chat API working ✅
```

**Option B: Complete Backend** (6 hours)
```bash
1. Create all 7 API routes
2. Test all endpoints
3. Update WebSocket integration
4. Result: Full gamification backend ready ✅
```

**Option C: Full Feature** (10 hours)
```bash
1. Create all 7 API routes
2. Create Settings + Profile pages
3. Add chat UI components
4. Result: Feature-complete demo ready ✅
```

---

## 🚀 READY TO BUILD?

**All materials prepared:**
- ✅ Service layer complete
- ✅ Code templates ready to copy
- ✅ Test guide included
- ✅ Documentation comprehensive
- ✅ DataStore methods available

**Just need to:**
1. Copy API route files
2. Run tests
3. Connect to frontend

**Estimated time to working chat: 2-3 hours**

Let's ship it! 🚀

---

**Questions? Check the documentation or service definitions.**
