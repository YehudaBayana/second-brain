CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    display_name text,
    email_verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash bytea NOT NULL UNIQUE,
    csrf_token_hash bytea NOT NULL,
    user_agent text NOT NULL DEFAULT '',
    ip inet,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_used_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS topics_user_name_idx ON topics(user_id, lower(name));

CREATE TABLE IF NOT EXISTS notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
    title text NOT NULL,
    question_asked text NOT NULL,
    source_text text NOT NULL DEFAULT '',
    ai_explanation text NOT NULL,
    key_takeaways jsonb,
    code_examples jsonb,
    source_url text,
    embedding vector(1536) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notes_user_created_idx ON notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notes_topic_id_idx ON notes(topic_id);

CREATE TABLE IF NOT EXISTS flashcards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
    front_question text NOT NULL,
    back_answer text NOT NULL,
    memory_level smallint NOT NULL DEFAULT 1 CHECK (memory_level BETWEEN 1 AND 5),
    next_review_date date NOT NULL DEFAULT (CURRENT_DATE + 1)
);
CREATE INDEX IF NOT EXISTS flashcards_due_idx ON flashcards(next_review_date);
