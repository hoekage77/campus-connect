# ✅ Updated: In-Memory Data Storage Strategy

**Date:** November 10, 2025  
**Change:** Switched from database (Prisma/PostgreSQL) to in-memory storage

---

## 🎯 What Changed

### Before
- Use Prisma + PostgreSQL for local development
- Requires database setup, migrations, connection strings
- More setup time, dependencies

### After (Now)
- ✅ Use JavaScript Maps and Sets for in-memory storage
- ✅ Zero setup required — just plain JavaScript
- ✅ Perfect for rapid prototyping and E2EE development
- ✅ Easy migration path to Supabase later

---

## 📦 Updated Dependencies

### Install These (Simplified)
```bash
cd /Users/macbookpro/csc456/campus-connect
npm install next-auth@beta libsodium-wrappers zod date-fns
npm install -D @types/libsodium-wrappers
```

### NOT Installing (Removed)
- ❌ @prisma/client
- ❌ prisma

---

## 🗄️ Data Storage Approach

### In-Memory Store (Development)
```typescript
// src/lib/data/store.ts
class DataStore {
  private users = new Map<string, User>();
  private groups = new Map<string, Group>();
  private messages = new Map<string, Message>();
  // ... etc
}

export const dataStore = new DataStore();
```

### Benefits
1. **Zero configuration** — No database setup needed
2. **Instant iterations** — Code changes take effect immediately
3. **Simple debugging** — Just inspect JavaScript objects
4. **Fast performance** — Everything in memory
5. **No migrations** — Change data models anytime

### Trade-offs
- Data resets on server restart (expected for development)
- Not production-ready (will migrate to Supabase later)

---

## 📁 Updated Project Structure

```
campus-connect/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/
│   │   └── ui/                 # shadcn components
│   ├── lib/
│   │   ├── data/               # ← NEW: In-memory data stores
│   │   │   ├── store.ts        #    Core DataStore class
│   │   │   ├── users.ts        #    User operations (optional helpers)
│   │   │   ├── groups.ts       #    Group operations
│   │   │   └── messages.ts     #    Message operations
│   │   ├── crypto/             # Encryption utilities
│   │   ├── auth.ts             # NextAuth config (no DB adapter)
│   │   └── utils.ts            # General utilities
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces (User, Group, etc.)
│   └── hooks/                  # Custom React hooks
├── IN_MEMORY_STORE.md          # ← NEW: Complete implementation guide
├── MIGRATION_PLAN.md           # Migration to Supabase guide
└── ... (other files)
```

---

## 🚀 Updated Next Steps

### 1. Install Dependencies (5 minutes)
```bash
cd /Users/macbookpro/csc456/campus-connect
npm install next-auth@beta libsodium-wrappers zod date-fns
npm install -D @types/libsodium-wrappers
```

### 2. Create Folder Structure (2 minutes)
```bash
mkdir -p src/lib/data
mkdir -p src/lib/crypto
mkdir -p src/types
mkdir -p src/hooks
```

### 3. Create Type Definitions (10 minutes)
```bash
# Create src/types/index.ts
# Copy interfaces from IN_MEMORY_STORE.md
# Defines: User, Group, GroupMember, Session, Message, RSVP
```

### 4. Implement DataStore (30 minutes)
```bash
# Create src/lib/data/store.ts
# Copy complete DataStore class from IN_MEMORY_STORE.md
# Includes demo data seeding
```

### 5. Create First API Route (15 minutes)
```bash
# Create src/app/api/groups/route.ts
# Use dataStore for GET/POST operations
# See example in IN_MEMORY_STORE.md
```

### 6. Test It Works (5 minutes)
```bash
npm run dev
# Visit http://localhost:3000/api/groups
# Should see demo groups
```

---

## 📚 Updated Documentation

All docs have been updated:
- ✅ `SETUP_STATUS.md` — Reflects in-memory approach
- ✅ `QUICK_REF.md` — Updated commands and next steps
- ✅ `IN_MEMORY_STORE.md` — NEW: Complete implementation guide
- ✅ `MIGRATION_PLAN.md` — Still valid for Supabase migration later
- ✅ `.env.example` — No DATABASE_URL needed now

---

## 🔄 Migration Path (Later)

When ready for production (after Phase 2):

### Easy Swap
```typescript
// Before (in-memory)
const groups = dataStore.getPublicGroups();

// After (Supabase)
const { data: groups } = await supabase
  .from('groups')
  .select('*')
  .eq('privacy', 'public');
```

**All your API routes stay the same!** Just swap the implementation.

See `MIGRATION_PLAN.md` for complete guide.

---

## 💡 Key Advantages

1. **Start coding immediately** — No database setup blocking you
2. **Focus on E2EE** — Build encryption features without DB complexity
3. **Rapid prototyping** — Change data models without migrations
4. **Easy testing** — Reset data with `dataStore.clear()`
5. **Clean migration** — TypeScript interfaces make Supabase migration easy

---

## 🎯 Updated Phase 0 Tasks

- [x] Initialize Next.js project
- [x] Configure shadcn/ui
- [x] Setup shadcn MCP server
- [x] Decide on data storage strategy (in-memory)
- [ ] Install core dependencies (next-auth, libsodium, zod)
- [ ] Create in-memory data store
- [ ] Create project folder structure
- [ ] Configure NextAuth (no DB adapter needed)

**Estimated time to Phase 0 completion:** 1-2 hours

---

## ⚡ Quick Start (Right Now)

```bash
# 1. Install dependencies
cd /Users/macbookpro/csc456/campus-connect
npm install next-auth@beta libsodium-wrappers zod date-fns
npm install -D @types/libsodium-wrappers

# 2. Create folders
mkdir -p src/{lib/data,lib/crypto,types,hooks}

# 3. Copy implementation
# Open IN_MEMORY_STORE.md
# Copy DataStore class to src/lib/data/store.ts
# Copy interfaces to src/types/index.ts

# 4. Start coding!
npm run dev
```

---

## 📞 Questions?

- **Implementation details:** See `IN_MEMORY_STORE.md`
- **Migration to Supabase:** See `MIGRATION_PLAN.md`
- **Overall architecture:** See `PROJECT_SPEC.md`
- **Task breakdown:** See `PROJECT_TRACKER.md`

---

**Status:** ✅ Ready to implement  
**Effort:** ~1-2 hours to complete Phase 0  
**Benefit:** Zero database complexity, instant iterations

Let's build! 🚀
