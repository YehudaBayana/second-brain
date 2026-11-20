ALTER TABLE notes
    ADD COLUMN source_text text NOT NULL DEFAULT '',
    ADD COLUMN source_url text;
