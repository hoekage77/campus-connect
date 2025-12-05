## Campus Connect Custom Agents — Usage and Examples

This file shows sample prompts and tasks for each agent in `./.github/agents/`.

1. Navigator Agent
  - Prompt: "What API endpoints are missing for the Chat feature?"
  - Response: "Missing endpoints: `/api/chat/rooms`, `/api/chat/[roomId]/messages`. Use `COPY_PASTE_API_ROUTES.ts` as templates. See docs/SPACES_PHASE_2_PLAN.md for real-time requirements."

2. Developer Workflow Agent
  - Prompt: "Bootstrapping check for macOS — run local dev and seed Supabase"
  - Steps:
    1. Confirm Node version `node -v`
    2. Confirm Python version `python3 --version` and `manim --version`
    3. Confirm `.env.local` keys exist
    4. Run `pnpm install` and `pnpm dev`
    5. Run seed script: `pnpm dlx tsx scripts/seed-supabase.ts`
  - Expected Outcome: all steps pass; `curl /api/groups` returns groups.

3. Implementation Assistant Agent
  - Prompt: "Scaffold `POST /api/chat/rooms` and `GET /api/chat/room/:id/messages` using the repository pattern"
  - Steps:
    1. Create route files under `app/api/chat/*`
    2. Wire Zod validators (createChatRoomSchema, getMessagesSchema)
    3. Use `getUserIdFromRequest()` and `getSupabaseRepository()`
  - Expected Outcome: Code compiles, `pnpm -s type-check` passes.

4. QA & Verification Agent
  - Prompt: "Run Chat smoke tests and show failing curl commands"
  - Steps:
    1. Run `pnpm test` and `pnpm -s type-check`
    2. Run curl commands in `docs/QUICK_REFERENCE.md`
    3. Check `db` seeded state for created rooms and messages
  - Expected Outcome: All smoke tests pass, failing tests produce a replay command

Orchestrator usage
  - Prompt: "Implement Chat endpoints and run all tests"
  - Actions:
    1. Developer Workflow: validate environment
    2. Navigator Agent: gather missing endpoints
    3. Implementation Assistant: scaffold endpoints and data-layer migration
    4. QA Agent: run tests and verify outputs

