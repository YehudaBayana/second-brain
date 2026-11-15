<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules

- Follow `README.md` for the frontend architecture and use the existing `@/src/...` imports.
- Keep routes Server Components by default; isolate interactivity in Client Components.
- Keep feature UI, API, hooks, queries, models, and state in `src/features/<feature>`; keep shared infrastructure in `src/services` and UI-independent rules in `src/domain`.
- Use TanStack Query for remote state. Reuse feature query keys/options for server prefetch and client hooks; convert transport DTOs to domain entities in selectors.
- Keep transient state local; use feature Zustand stores only for state shared across screens. Do not mirror query data in Zustand.
- Run `yarn lint` and `yarn tsc --noEmit`; use `yarn build --webpack` for build validation.
