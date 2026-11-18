package dbmigrate

import (
	"bytes"
	"context"
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"path"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed sql
var migrationFiles embed.FS

var migrationNamePattern = regexp.MustCompile(`^([0-9]{3,})_[a-z0-9]+(?:_[a-z0-9]+)*\.sql$`)

const migrationLockID int64 = 0x53424d4947524154

type migration struct {
	version  int64
	name     string
	contents []byte
	checksum string
}

type AppliedMigration struct {
	Version int64  `json:"version"`
	Name    string `json:"name"`
}

type ApplyResult struct {
	Applied []AppliedMigration `json:"applied"`
}

type Handler struct {
	db    *pgxpool.Pool
	files fs.FS
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return NewHandlerWithFS(db, migrationFiles)
}

func NewHandlerWithFS(db *pgxpool.Pool, files fs.FS) *Handler {
	return &Handler{
		db:    db,
		files: files,
	}
}

func (handler *Handler) RegisterRoutes(
	mux *http.ServeMux,
	protectedWrite func(http.Handler) http.Handler,
) {
	mux.Handle("POST /api/migrations", protectedWrite(http.HandlerFunc(handler.Apply)))
}

// ApplyMigrations applies any pending database migrations using the handler's database pool and migration files.
func (handler *Handler) ApplyMigrations(ctx context.Context) ([]AppliedMigration, error) {
	if handler.db == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}
	files := handler.files
	if files == nil {
		files = migrationFiles
	}
	migrations, err := loadMigrations(files)
	if err != nil {
		return nil, fmt.Errorf("load database migrations: %w", err)
	}
	return applyMigrations(ctx, handler.db, migrations)
}

func (handler *Handler) Apply(responseWriter http.ResponseWriter, request *http.Request) {
	applied, err := handler.ApplyMigrations(request.Context())
	if err != nil {
		log.Printf("Apply database migrations: %v", err)
		writeError(responseWriter, http.StatusInternalServerError, fmt.Sprintf("Database migration failed: %v", err))
		return
	}

	responseWriter.Header().Set("Content-Type", "application/json; charset=utf-8")
	if err := json.NewEncoder(responseWriter).Encode(ApplyResult{Applied: applied}); err != nil {
		log.Printf("Write migration response: %v", err)
	}
}

func applyMigrations(
	ctx context.Context,
	db *pgxpool.Pool,
	migrations []migration,
) ([]AppliedMigration, error) {
	tx, err := db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin migration transaction: %w", err)
	}
	defer func() {
		if err := tx.Rollback(context.Background()); err != nil && !errors.Is(err, pgx.ErrTxClosed) {
			log.Printf("Rollback migration transaction: %v", err)
		}
	}()

	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", migrationLockID); err != nil {
		return nil, fmt.Errorf("lock migrations: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version bigint PRIMARY KEY,
			name text NOT NULL,
			checksum text NOT NULL,
			applied_at timestamptz NOT NULL DEFAULT now()
		)`); err != nil {
		return nil, fmt.Errorf("create migration history table: %w", err)
	}

	rows, err := tx.Query(ctx, `SELECT version, name, checksum FROM schema_migrations`)
	if err != nil {
		return nil, fmt.Errorf("read migration history: %w", err)
	}
	defer rows.Close()

	applied := make(map[int64]migration, len(migrations))
	for rows.Next() {
		var existing migration
		if err := rows.Scan(&existing.version, &existing.name, &existing.checksum); err != nil {
			return nil, fmt.Errorf("read migration history row: %w", err)
		}
		applied[existing.version] = existing
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read migration history rows: %w", err)
	}

	pending, err := planMigrations(migrations, applied)
	if err != nil {
		return nil, err
	}

	result := make([]AppliedMigration, 0, len(pending))
	for _, current := range pending {
		if _, err := tx.Exec(ctx, string(current.contents)); err != nil {
			return nil, fmt.Errorf("execute migration %s: %w", current.name, err)
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)`,
			current.version, current.name, current.checksum,
		); err != nil {
			return nil, fmt.Errorf("record migration %s: %w", current.name, err)
		}
		result = append(result, AppliedMigration{
			Version: current.version,
			Name:    current.name,
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit migrations: %w", err)
	}

	return result, nil
}

// planMigrations validates that applied migrations match available files (integrity check),
// ensures no pending migrations are applied out of order, and returns pending migrations to apply.
func planMigrations(available []migration, applied map[int64]migration) ([]migration, error) {
	availableMap := make(map[int64]migration, len(available))
	for _, m := range available {
		availableMap[m.version] = m
	}

	// 1. Verify all previously applied migrations are still present in available files and match
	var maxAppliedVersion int64
	for version, prev := range applied {
		if version > maxAppliedVersion {
			maxAppliedVersion = version
		}
		curr, ok := availableMap[version]
		if !ok {
			return nil, fmt.Errorf("applied migration %s (version %d) is missing from the migration files", prev.name, version)
		}
		if curr.name != prev.name || curr.checksum != prev.checksum {
			return nil, fmt.Errorf("applied migration %03d (%s) has changed", version, curr.name)
		}
	}

	// 2. Determine pending migrations and ensure no out-of-order migrations
	var pending []migration
	for _, current := range available {
		if _, wasApplied := applied[current.version]; wasApplied {
			continue
		}
		if len(applied) > 0 && current.version < maxAppliedVersion {
			return nil, fmt.Errorf("pending migration %s has version %d, which is lower than latest applied version %d (out-of-order migration)",
				current.name, current.version, maxAppliedVersion)
		}
		pending = append(pending, current)
	}

	return pending, nil
}

func loadMigrations(files fs.FS) ([]migration, error) {
	entries, err := fs.ReadDir(files, "sql")
	if err != nil {
		return nil, fmt.Errorf("read migration directory: %w", err)
	}

	var migrations []migration
	versions := make(map[int64]string)
	for _, entry := range entries {
		if entry.IsDir() || path.Ext(entry.Name()) != ".sql" {
			continue
		}
		matches := migrationNamePattern.FindStringSubmatch(entry.Name())
		if matches == nil {
			return nil, fmt.Errorf("invalid migration filename %q; expected NNN_description.sql", entry.Name())
		}
		version, err := strconv.ParseInt(matches[1], 10, 64)
		if err != nil {
			return nil, fmt.Errorf("parse migration version from %q: %w", entry.Name(), err)
		}
		if previous, exists := versions[version]; exists {
			return nil, fmt.Errorf("migrations %q and %q use the same version", previous, entry.Name())
		}

		contents, err := fs.ReadFile(files, path.Join("sql", entry.Name()))
		if err != nil {
			return nil, fmt.Errorf("read migration %q: %w", entry.Name(), err)
		}
		if strings.TrimSpace(string(contents)) == "" {
			return nil, fmt.Errorf("migration %q is empty", entry.Name())
		}
		// Normalize line endings to LF so checksums remain identical across OSes (e.g. Windows CRLF checkouts)
		contents = bytes.ReplaceAll(contents, []byte("\r\n"), []byte("\n"))
		checksum := sha256.Sum256(contents)
		migrations = append(migrations, migration{
			version:  version,
			name:     entry.Name(),
			contents: contents,
			checksum: hex.EncodeToString(checksum[:]),
		})
		versions[version] = entry.Name()
	}

	sort.Slice(migrations, func(left, right int) bool {
		return migrations[left].version < migrations[right].version
	})
	return migrations, nil
}

func writeError(responseWriter http.ResponseWriter, status int, message string) {
	responseWriter.Header().Set("Content-Type", "application/json; charset=utf-8")
	responseWriter.WriteHeader(status)
	_ = json.NewEncoder(responseWriter).Encode(map[string]any{
		"error": map[string]string{
			"code":    "migration_failed",
			"message": message,
		},
	})
}
