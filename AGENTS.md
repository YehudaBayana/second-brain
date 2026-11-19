# Repository-wide agent rules

- Keep agent rules clear, short, concise, and understandable.
- Avoid hard-coding app-wide or tunable values in business logic. Define shared
  settings such as timeouts, limits, model IDs, and service URLs once in the
  owning stack's config/constants module, then reference them at each call site.
  Keep backend settings in `server/config` and frontend settings in
  `frontend/src/config`; if a stack has no such module yet, create one before
  adding shared settings. Do not duplicate settings across backend and frontend
  when they represent the same cross-stack contract.
