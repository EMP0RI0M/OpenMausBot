# OpenMausBot mobile — improvement plan

Scope: `apps/mobile` (Expo / React Native client). ~5,200 LOC across 28 files.
Typecheck is clean; the risk is structural, not compiler errors.

## Health snapshot (measured)
- **0 tests** before this work, yet recent history is full of runtime crashes
  (LinearGradient, React-Refresh hoisting, async-IIFE-in-useEffect, storage
  fallback) — the classic signature of an untested client.
- Manual `useState` tab switching in `App.tsx` with prop-drilled
  `onClose`/`onOpen*` callbacks; no router/deep-link/back handling.
- `OpenMausContext` (489 LOC) is a single god-provider: persistence + SSE +
  connection lifecycle + message state + standalone sandbox execution + routines.
- 14 `any` and 16 `console.*` on production paths; server responses unmapped.

## Priorities

### P0 — reliability that bites real phone users
1. **SSE reconnect** — DONE. `api.ts#subscribeToEvents` now reopens a dropped
   stream with capped exponential backoff + jitter, collapses the backoff when
   data flows, and exposes a disposer that stops reconnection. Guarded by
   `src/services/api.reconnect.test.ts`. (Previously a single drop left the UI
   permanently stale — the #1 mobile failure mode.)
2. **Wire-contract mismatch (root cause behind the append race)** — DONE.
   The phone's SSE frames are `{ kind: "message" | "message.patch", threadId,
   message }` where `message` is a server `WireMessage` (`text`/`at`/`role:
   "bot"`/`tool`/`card`/`from.botId`). The client matched `event.type ===
   "message"` and `event.botId` (never present) → **live streaming was silently
   dead**, and `fetchMessages` read `content`/`createdAt`/`toolActivities` the
   server doesn't send → wrong ordering + lost tool activity. Added a pure,
   fixture-tested adapter `src/state/wireAdapter.ts` (`normalizeMessage` /
   `upsertMessage` / `reconcileMessages`); routed the SSE handler and
   `fetchMessages` through it, made `selectBot` reconcile-not-overwrite (stops
   dropping in-flight tokens), and made assistant messages upsert idempotently
   by id. **Caveat:** on-device, confirm the companion relay forwards
   `kind:"message"`/`"message.patch"` to the phone before trusting live deltas.
3. **Standalone command injection** — DONE. `src/state/standaloneCommand.ts`
   now parses input explicitly: `!cmd` runs verbatim in the sandbox (the user's
   own terminal line), everything else is passed to `agy -p` as a POSIX
   single-quoted argv (`shellQuote`) — the old `text.replace(/"/g,'\\"')`
   double-quote escape was bypassable, and the `startsWith('agy'|'ls'|'cat')`
   guessing silently turned ordinary chat into shell. Guarded by
   `src/state/standaloneCommand.test.ts` (injection fixtures assert inertness).
4. **Error boundary** — DONE. `src/components/ErrorBoundary.tsx` wraps the
   screen container in `App.tsx`, keyed per tab so one crashing screen can't
   white-screen the app (the LinearGradient-class failure). Fallback offers
   "Try again" (remount) and "Back to chat" (reset). Not render-tested —
   component tests need a react-native preset (P1 backlog).

### P1 — testability (unblocks safe P0 work; honors AGENTS.md verify-on-fixture)
- vitest harness added: `apps/mobile/vitest.config.ts` (node env, scoped to
  `apps/mobile/src`), run via `pnpm test:mobile`.
- DONE: adapter tests (`wireAdapter.test.ts`), reconnect tests, storage
  fallback tests (`storage.test.ts`: SecureStore-first, AsyncStorage on
  native throw / web, delete clears both), standalone quoting tests.
- DONE: CI — `.github/workflows/ci.yml` gained a `mobile-tests` job (in the
  merge `gate`), so mobile logic regressions fail PRs.
- Component rendering tests would still need a react-native preset — deferred.

### P2 — structure
- Split `OpenMausContext` into `useConnection` / `useMessages` / `useSSE` /
  `useSandbox` hooks behind a thin provider, keeping the public context shape.
- Consider `expo-router` for navigation (deep links, back gesture, history).

### P3 — cleanup
- Remove `any` on `fetchBots`/`fetchMessages`/SSE payloads with response types
  in `types/models.ts`; drop `console.*` in favour of a logger behind a flag.

## Verification note
Per `AGENTS.md`: any server/conversation change must be validated on an isolated
fixture, never the live app or user data. Mobile logic tests currently run pure
(node env) and touch no live backend.
