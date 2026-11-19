# Second Brain

A personal learning library: capture a question and your notes, turn them into a structured lesson, save optional quiz cards, and revisit them with spaced repetition.

## Run locally

### Requirements

- Go 1.27+
- Node.js and Yarn
- PostgreSQL with the `pgvector` extension installed
- A Gemini API key

### Configure

Copy `.env.example` to `.env` and set `DATABASE_URL` and `GEMINI_API_KEY`. The database role needs permission to install the `vector` extension when applying the initial migration. For deployment, set `ALLOWED_ORIGINS` to the frontend origin and `COOKIE_SECURE=true` when serving over HTTPS.

### Database migrations

The full initial database schema is in `server/dbmigrate/sql/001_initial_schema.sql`.
Add future changes as numbered SQL files in `server/dbmigrate/sql`, starting
with the next available number. Keep applied migration files unchanged, and
deploy the API with the new file. The API applies pending migrations in numeric
order at startup. While signed in, **Run migrations** in the application header
can also apply pending files. Migrations are the only source of schema changes.

If you previously applied the old `001_optional_note_sections.sql` migration,
recreate your development database before starting this version because the
initial migration now takes version `001`.

Copy `frontend/env.local.example` to `frontend/.env.local` if the API is not at `http://localhost:8080`.

### Start the API

```sh
cd server
go run .
```

The API listens on `http://localhost:8080`. It loads `../.env` when started from this directory.

### Start the frontend

In another terminal:

```sh
cd frontend
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and add a question. Paste a transcript or excerpt in the notes field to ground the generated lesson. A source URL is saved as a citation; this MVP does not fetch YouTube captions or web pages automatically.

## What works in this MVP

- Email/password registration and login with server-side sessions.
- Per-user topics, notes, generated lessons, key takeaways, and code examples.
- Optional AI-generated flashcards, due-date review, and five-level scheduling.
- Hybrid note search that combines Gemini embeddings with PostgreSQL full-text search.
- Related-note suggestions when saving a note.

The learning API currently generates a lesson synchronously to keep the first end-to-end flow simple. The existing Redis queue remains available at `POST /job`, but it is not connected to note generation. There is no scheduled weekly quiz yet; cards appear in the review queue on their due dates.

## Run checks

```sh
(cd server && go test ./...)
(cd frontend && yarn lint && npx tsc --noEmit)
```
