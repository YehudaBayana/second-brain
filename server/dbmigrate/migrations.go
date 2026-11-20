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
	"io"
	"io/fs"
	"log"
	"net/http"
	"path"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed sql
var migrationFiles embed.FS

var migrationNamePattern = regexp.MustCompile(`^([0-9]{3,})_[a-z0-9]+(?:_[a-z0-9]+)*\.up\.sql$`)

const migrationLockID int64 = 0x53424d4947524154

type migration struct {
	version      int64
	name         string
	contents     []byte
	downContents []byte
	checksum     string
}

type AppliedMigration struct {
	Version int64  `json:"version"`
	Name    string `json:"name"`
}

type MigrationHistoryItem struct {
	Version   int64      `json:"version"`
	Name      string     `json:"name"`
	Status    string     `json:"status"`
	AppliedAt *time.Time `json:"applied_at,omitempty"`
}

type MigrationEvent struct {
	ID         int64     `json:"id"`
	Version    int64     `json:"version"`
	Name       string    `json:"name"`
	Action     string    `json:"action"`
	OccurredAt time.Time `json:"occurred_at"`
}

type HistoryResult struct {
	Migrations []MigrationHistoryItem `json:"migrations"`
	Events     []MigrationEvent       `json:"events"`
}

type ApplyResult struct {
	Applied []AppliedMigration `json:"applied"`
}

type RollbackRequest struct {
	TargetVersion *int64 `json:"target_version"`
}

type RollbackResult struct {
	RolledBack []AppliedMigration `json:"rolled_back"`
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
	protectedRead func(http.Handler) http.Handler,
	protectedWrite func(http.Handler) http.Handler,
) {
	mux.Handle("GET /api/migrations", protectedRead(http.HandlerFunc(handler.History)))
	mux.Handle("POST /api/migrations", protectedWrite(http.HandlerFunc(handler.Apply)))
	mux.Handle("POST /api/migrations/rollback", protectedWrite(http.HandlerFunc(handler.Rollback)))
}

// ApplyMigrations explicitly applies pending database migrations.
func (handler *Handler) ApplyMigrations(ctx context.Context) ([]AppliedMigration, error) {
	migrations, err := handler.loadMigrations()
	if err != nil {
		return nil, err
	}
	return applyMigrations(ctx, handler.db, migrations)
}

// BootstrapMigrations creates the initial schema on a new database. It never
// applies pending migrations to an existing migration ledger.
func (handler *Handler) BootstrapMigrations(ctx context.Context) ([]AppliedMigration, error) {
	migrations, err := handler.loadMigrations()
	if err != nil {
		return nil, err
	}
	var hasMigrationLedger bool
	if err := handler.db.QueryRow(ctx, `SELECT to_regclass('schema_migrations') IS NOT NULL`).Scan(&hasMigrationLedger); err != nil {
		return nil, fmt.Errorf("check migration ledger: %w", err)
	}
	if hasMigrationLedger {
		return []AppliedMigration{}, nil
	}
	for _, current := range migrations {
		if current.version == 1 {
			return applyMigrations(ctx, handler.db, []migration{current})
		}
	}
	return nil, fmt.Errorf("initial migration version 1 is missing")
}

func (handler *Handler) loadMigrations() ([]migration, error) {
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
	return migrations, nil
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

func (handler *Handler) History(responseWriter http.ResponseWriter, request *http.Request) {
	if handler.db == nil {
		writeError(responseWriter, http.StatusInternalServerError, "Database connection is not initialized")
		return
	}
	migrations, err := handler.loadMigrations()
	if err != nil {
		log.Printf("Load database migration history: %v", err)
		writeError(responseWriter, http.StatusInternalServerError, fmt.Sprintf("Could not load migration history: %v", err))
		return
	}
	history, err := migrationHistory(request.Context(), handler.db, migrations)
	if err != nil {
		log.Printf("Read database migration history: %v", err)
		writeError(responseWriter, http.StatusInternalServerError, fmt.Sprintf("Could not load migration history: %v", err))
		return
	}
	responseWriter.Header().Set("Content-Type", "application/json; charset=utf-8")
	if err := json.NewEncoder(responseWriter).Encode(history); err != nil {
		log.Printf("Write migration history response: %v", err)
	}
}

func (handler *Handler) Rollback(responseWriter http.ResponseWriter, request *http.Request) {
	var body RollbackRequest
	decoder := json.NewDecoder(http.MaxBytesReader(responseWriter, request.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&body); err != nil {
		writeAPIError(responseWriter, http.StatusBadRequest, "invalid_migration_request", fmt.Sprintf("Invalid rollback request: %v", err))
		return
	}
	if body.TargetVersion == nil {
		writeAPIError(responseWriter, http.StatusBadRequest, "invalid_migration_request", "Rollback request requires target_version")
		return
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		writeAPIError(responseWriter, http.StatusBadRequest, "invalid_migration_request", "Rollback request must contain a single JSON object")
		return
	}

	rolledBack, err := handler.RollbackMigrations(request.Context(), *body.TargetVersion)
	if err != nil {
		log.Printf("Rollback database migrations: %v", err)
		if errors.Is(err, errInvalidRollbackTarget) {
			writeAPIError(responseWriter, http.StatusBadRequest, "invalid_migration_target", err.Error())
			return
		}
		writeError(responseWriter, http.StatusInternalServerError, fmt.Sprintf("Database rollback failed: %v", err))
		return
	}
	responseWriter.Header().Set("Content-Type", "application/json; charset=utf-8")
	if err := json.NewEncoder(responseWriter).Encode(RollbackResult{RolledBack: rolledBack}); err != nil {
		log.Printf("Write migration rollback response: %v", err)
	}
}

func (handler *Handler) RollbackMigrations(ctx context.Context, targetVersion int64) ([]AppliedMigration, error) {
	if targetVersion < 0 {
		return nil, fmt.Errorf("%w: version cannot be negative", errInvalidRollbackTarget)
	}
	migrations, err := handler.loadMigrations()
	if err != nil {
		return nil, err
	}
	return rollbackMigrations(ctx, handler.db, migrations, targetVersion)
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
	if err := ensureMigrationTables(ctx, tx); err != nil {
		return nil, err
	}
	applied, err := readAppliedMigrations(ctx, tx)
	if err != nil {
		return nil, err
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
		if _, err := tx.Exec(ctx,
			`INSERT INTO schema_migration_events (version, name, action) VALUES ($1, $2, 'applied')`,
			current.version, current.name,
		); err != nil {
			return nil, fmt.Errorf("record migration event %s: %w", current.name, err)
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

var errInvalidRollbackTarget = errors.New("invalid rollback target")

func rollbackMigrations(
	ctx context.Context,
	db *pgxpool.Pool,
	migrations []migration,
	targetVersion int64,
) ([]AppliedMigration, error) {
	tx, err := db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin rollback transaction: %w", err)
	}
	defer func() {
		if err := tx.Rollback(context.Background()); err != nil && !errors.Is(err, pgx.ErrTxClosed) {
			log.Printf("Rollback migration transaction: %v", err)
		}
	}()

	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", migrationLockID); err != nil {
		return nil, fmt.Errorf("lock migrations: %w", err)
	}
	if err := ensureMigrationTables(ctx, tx); err != nil {
		return nil, err
	}
	applied, err := readAppliedMigrations(ctx, tx)
	if err != nil {
		return nil, err
	}
	if _, err := planMigrations(migrations, applied); err != nil {
		return nil, err
	}

	if targetVersion != 0 {
		if _, exists := applied[targetVersion]; !exists {
			return nil, fmt.Errorf("%w: version %d is not currently applied", errInvalidRollbackTarget, targetVersion)
		}
	}

	var maxAppliedVersion int64
	for version := range applied {
		if version > maxAppliedVersion {
			maxAppliedVersion = version
		}
	}
	if targetVersion > maxAppliedVersion {
		return nil, fmt.Errorf("%w: version %d is newer than the current database version %d", errInvalidRollbackTarget, targetVersion, maxAppliedVersion)
	}

	result := make([]AppliedMigration, 0)
	for index := len(migrations) - 1; index >= 0; index-- {
		current := migrations[index]
		if current.version <= targetVersion {
			continue
		}
		if _, isApplied := applied[current.version]; !isApplied {
			continue
		}
		if len(current.downContents) == 0 {
			return nil, fmt.Errorf("migration %s has no down migration", current.name)
		}
		if _, err := tx.Exec(ctx, string(current.downContents)); err != nil {
			return nil, fmt.Errorf("execute down migration %s: %w", current.name, err)
		}
		if _, err := tx.Exec(ctx, `DELETE FROM schema_migrations WHERE version = $1`, current.version); err != nil {
			return nil, fmt.Errorf("remove migration state %s: %w", current.name, err)
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO schema_migration_events (version, name, action) VALUES ($1, $2, 'rolled_back')`,
			current.version, current.name,
		); err != nil {
			return nil, fmt.Errorf("record rollback event %s: %w", current.name, err)
		}
		result = append(result, AppliedMigration{Version: current.version, Name: current.name})
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit migration rollback: %w", err)
	}
	return result, nil
}

func ensureMigrationTables(ctx context.Context, tx pgx.Tx) error {
	if _, err := tx.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version bigint PRIMARY KEY,
			name text NOT NULL,
			checksum text NOT NULL,
			applied_at timestamptz NOT NULL DEFAULT now()
		)`); err != nil {
		return fmt.Errorf("create migration state table: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migration_events (
			id bigserial PRIMARY KEY,
			version bigint NOT NULL,
			name text NOT NULL,
			action text NOT NULL CHECK (action IN ('applied', 'rolled_back')),
			occurred_at timestamptz NOT NULL DEFAULT now()
		)`); err != nil {
		return fmt.Errorf("create migration event history table: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO schema_migration_events (version, name, action, occurred_at)
		SELECT sm.version, sm.name, 'applied', sm.applied_at
		FROM schema_migrations sm
		WHERE NOT EXISTS (
			SELECT 1 FROM schema_migration_events event
			WHERE event.version = sm.version AND event.action = 'applied'
		)`); err != nil {
		return fmt.Errorf("initialize migration event history: %w", err)
	}
	return nil
}

func readAppliedMigrations(ctx context.Context, queryer interface {
	Query(context.Context, string, ...any) (pgx.Rows, error)
}) (map[int64]migration, error) {
	rows, err := queryer.Query(ctx, `SELECT version, name, checksum FROM schema_migrations`)
	if err != nil {
		return nil, fmt.Errorf("read migration state: %w", err)
	}
	defer rows.Close()

	applied := make(map[int64]migration)
	for rows.Next() {
		var existing migration
		if err := rows.Scan(&existing.version, &existing.name, &existing.checksum); err != nil {
			return nil, fmt.Errorf("read migration state row: %w", err)
		}
		applied[existing.version] = existing
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read migration state rows: %w", err)
	}
	return applied, nil
}

func migrationHistory(ctx context.Context, db *pgxpool.Pool, migrations []migration) (HistoryResult, error) {
	tx, err := db.BeginTx(ctx, pgx.TxOptions{
		IsoLevel:   pgx.RepeatableRead,
		AccessMode: pgx.ReadOnly,
	})
	if err != nil {
		return HistoryResult{}, fmt.Errorf("begin migration history transaction: %w", err)
	}
	defer func() {
		if err := tx.Rollback(context.Background()); err != nil && !errors.Is(err, pgx.ErrTxClosed) {
			log.Printf("Rollback migration history transaction: %v", err)
		}
	}()

	appliedRows, err := tx.Query(ctx, `SELECT version, name, checksum, applied_at FROM schema_migrations`)
	if err != nil {
		return HistoryResult{}, fmt.Errorf("read migration state: %w", err)
	}
	defer appliedRows.Close()
	appliedAt := make(map[int64]time.Time)
	applied := make(map[int64]migration)
	for appliedRows.Next() {
		var current migration
		var timestamp time.Time
		if err := appliedRows.Scan(&current.version, &current.name, &current.checksum, &timestamp); err != nil {
			return HistoryResult{}, fmt.Errorf("read migration state row: %w", err)
		}
		applied[current.version] = current
		appliedAt[current.version] = timestamp
	}
	if err := appliedRows.Err(); err != nil {
		return HistoryResult{}, fmt.Errorf("read migration state rows: %w", err)
	}
	appliedRows.Close()
	if _, err := planMigrations(migrations, applied); err != nil {
		return HistoryResult{}, err
	}

	result := HistoryResult{
		Migrations: make([]MigrationHistoryItem, 0, len(migrations)),
		Events:     make([]MigrationEvent, 0),
	}
	for _, current := range migrations {
		item := MigrationHistoryItem{Version: current.version, Name: current.name, Status: "pending"}
		if timestamp, exists := appliedAt[current.version]; exists {
			item.Status = "applied"
			item.AppliedAt = &timestamp
		}
		result.Migrations = append(result.Migrations, item)
	}
	eventRows, err := tx.Query(ctx, `SELECT id, version, name, action, occurred_at FROM schema_migration_events ORDER BY id DESC`)
	if err != nil {
		return HistoryResult{}, fmt.Errorf("read migration events: %w", err)
	}
	defer eventRows.Close()
	for eventRows.Next() {
		var event MigrationEvent
		if err := eventRows.Scan(&event.ID, &event.Version, &event.Name, &event.Action, &event.OccurredAt); err != nil {
			return HistoryResult{}, fmt.Errorf("read migration event row: %w", err)
		}
		result.Events = append(result.Events, event)
	}
	if err := eventRows.Err(); err != nil {
		return HistoryResult{}, fmt.Errorf("read migration event rows: %w", err)
	}
	eventRows.Close()
	if err := tx.Commit(ctx); err != nil {
		return HistoryResult{}, fmt.Errorf("commit migration history transaction: %w", err)
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
		if entry.IsDir() || path.Ext(entry.Name()) != ".sql" || strings.HasSuffix(entry.Name(), ".down.sql") {
			continue
		}
		matches := migrationNamePattern.FindStringSubmatch(entry.Name())
		if matches == nil {
			return nil, fmt.Errorf("invalid migration filename %q; expected NNN_description.up.sql", entry.Name())
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
		downPath := path.Join("sql", strings.TrimSuffix(entry.Name(), ".up.sql")+".down.sql")
		downContents, err := fs.ReadFile(files, downPath)
		if err != nil {
			return nil, fmt.Errorf("read down migration %q: %w", path.Base(downPath), err)
		}
		if strings.TrimSpace(string(downContents)) == "" {
			return nil, fmt.Errorf("down migration %q is empty", path.Base(downPath))
		}
		downContents = bytes.ReplaceAll(downContents, []byte("\r\n"), []byte("\n"))
		checksum := sha256.Sum256(contents)
		migrations = append(migrations, migration{
			version:      version,
			name:         strings.TrimSuffix(entry.Name(), ".up.sql") + ".sql",
			contents:     contents,
			downContents: downContents,
			checksum:     hex.EncodeToString(checksum[:]),
		})
		versions[version] = entry.Name()
	}

	sort.Slice(migrations, func(left, right int) bool {
		return migrations[left].version < migrations[right].version
	})
	return migrations, nil
}

func writeError(responseWriter http.ResponseWriter, status int, message string) {
	writeAPIError(responseWriter, status, "migration_failed", message)
}

func writeAPIError(responseWriter http.ResponseWriter, status int, code string, message string) {
	responseWriter.Header().Set("Content-Type", "application/json; charset=utf-8")
	responseWriter.WriteHeader(status)
	_ = json.NewEncoder(responseWriter).Encode(map[string]any{
		"error": map[string]string{
			"code":    code,
			"message": message,
		},
	})
}
