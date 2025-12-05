Phase 2: WebSocket Migration
--------------------------------

What changed:
- Added a development WebSocket server at `/api/ws` (Next.js pages/api) that attaches to the underlying HTTP server.
- Realtime DataStore events are forwarded via WebSocket: `message`, `chatMessage`, `groupMembers`, `notification`.
- Clients subscribe to group/user events via `type: 'subscribe'` messages and receive an initial snapshot.
- Client components (`GroupChat`, `GroupMembers`, `NotificationsBell`) now use WebSocket, with SSE/polling fallback.

How it works:
- Clients connect to `ws://HOST/api/ws` or `wss://HOST/api/ws`.
- After connection, send JSON messages like `subscribe` and `message` consistently across the app.
- The server receives actions from clients and applies them using `dataStore` methods; the `dataStore` emits events which are broadcast back to clients.

Notes and next steps:
- This WebSocket server is intended for local/dev and PoC usage. For production you should deploy a persistent WebSocket backend (managed PaaS) or use Redis pub/sub + a WS server that scales.
- Add reconnection/backoff on clients and authenticated authorization for messages.
- Consider moving event schema to a shared TypeScript definition for strong typing across client/server.
