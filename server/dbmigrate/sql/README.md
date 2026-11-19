The initial database schema is defined in `001_initial_schema.sql`. Add future
database changes as numbered SQL files in this directory, using the next
available number (for example, `003_add_note_tags.sql`). Keep applied migration
files unchanged and in the repository. The API applies migrations in numeric
order, in one transaction, at startup. The **Run migrations** action can also
apply pending migrations while the API is running.
