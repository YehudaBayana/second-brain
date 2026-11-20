ALTER TABLE notes
    ALTER COLUMN key_takeaways DROP NOT NULL,
    ALTER COLUMN key_takeaways DROP DEFAULT,
    ALTER COLUMN code_examples DROP NOT NULL,
    ALTER COLUMN code_examples DROP DEFAULT;
