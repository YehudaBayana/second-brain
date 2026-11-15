# Second Brain frontend

The frontend is a Next.js App Router application. Route files compose feature
views; feature modules own their API access, query hooks, interaction hooks, and
feature-specific state.

## Architecture

- `src/app` contains route entry points and layouts. Keep route pages as Server
  Components and put interactive UI behind Client Component boundaries.
- `src/features/<feature>` contains feature-owned components, hooks, query
  definitions, API services, and models. Keep feature state here rather than
  adding unrelated global state.
- `src/domain` contains entities and business rules that should not depend on
  the UI.
- `src/services` contains cross-feature infrastructure such as HTTP clients
  and query keys.

Use TanStack Query for remote/server state. Define a query key and fetcher once
in the feature query module, then reuse it for both server prefetching and client
hooks. Keep prefetched data serializable across the Server/Client boundary;
convert DTOs to domain entities in query selectors.

Use component props for values a child directly needs. For state shared across
several screens, use the feature's Zustand store; use local state for short-lived
interaction state. Avoid mirroring query data in Zustand or introducing a
global store for state with a single owner.

## Rendering and loading

Authenticated routes read the session on the server. Keep request-dependent
session and data work behind Suspense boundaries so Cache Components can render
a static shell and stream in the authenticated page. Prefetch page data on the
server and hydrate the same query keys on the client to avoid an empty-data
flash. Route `loading.tsx` fallbacks and client query fallbacks should use the
shared skeletons in `src/components/feedback`.

## Development

```bash
yarn dev
yarn lint
yarn tsc --noEmit
yarn build --webpack
```
