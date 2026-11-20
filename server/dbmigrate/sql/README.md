The initial database schema is defined in `001_initial_schema.up.sql`. Add
future database changes as numbered `.up.sql` and `.down.sql` pairs in this
directory, using the next available number (for example,
`003_add_note_tags.up.sql` and `003_add_note_tags.down.sql`). Keep both files
for every migration and never edit a migration after it has been applied.

On a new database the API bootstraps only version 1 so the application can start.
Pending migrations are never applied automatically on server startup. Apply
them explicitly from the Migrations page; each apply or rollback operation is
transactional. Rolling back to a version executes each later down migration in
reverse order in one transaction.

Rolling back to version 0 removes the application tables and their data. The
vector extension is intentionally retained because it may be shared by other
schemas.
