# Second Brain

A personal learning library: capture a question and your notes, turn them into a structured lesson, save optional quiz cards, and revisit them with spaced repetition.

## Run locally

### Requirements

- Go 1.27+
- Node.js and Yarn
- PostgreSQL with the `pgvector` extension installed
- A Gemini API key

### Configure

Copy `.env.example` to `.env` and set `DATABASE_URL` and `GEMINI_API_KEY`. The API creates its base tables and enables the `vector` extension at startup, so the database role needs permission to install that extension. For deployment, set `ALLOWED_ORIGINS` to the frontend origin and `COOKIE_SECURE=true` when serving over HTTPS.

### Database migrations

Add incremental database changes as numbered SQL files in `server/dbmigrate/sql`,
for example `001_add_note_tags.sql`. Use the next unused number, keep applied
migration files unchanged, and deploy the API with the new file. While signed
in, click **Run migrations** in the application header to apply pending files
in numeric order. The base `schema.sql` remains the startup bootstrap for a
new database; numbered migrations are not applied automatically.

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
