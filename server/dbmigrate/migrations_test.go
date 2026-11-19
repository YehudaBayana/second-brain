package dbmigrate

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
)

func TestLoadMigrationsSortsByVersion(t *testing.T) {
	files := fstest.MapFS{
		"sql/002_add_cards.sql":    &fstest.MapFile{Data: []byte("SELECT 2;")},
		"sql/001_create_notes.sql": &fstest.MapFile{Data: []byte("SELECT 1;")},
		"sql/README.md":            &fstest.MapFile{Data: []byte("Migration instructions")},
	}

	migrations, err := loadMigrations(files)
	if err != nil {
		t.Fatalf("loadMigrations() error = %v", err)
	}
	if len(migrations) != 2 {
		t.Fatalf("loaded %d migrations, want 2", len(migrations))
	}
	if migrations[0].version != 1 || migrations[0].name != "001_create_notes.sql" {
		t.Errorf("first migration = (%d, %q), want (1, %q)", migrations[0].version, migrations[0].name, "001_create_notes.sql")
	}
	if migrations[1].version != 2 || migrations[1].name != "002_add_cards.sql" {
		t.Errorf("second migration = (%d, %q), want (2, %q)", migrations[1].version, migrations[1].name, "002_add_cards.sql")
	}
}

func TestEmbeddedMigrationsStartWithInitialSchema(t *testing.T) {
	migrations, err := loadMigrations(migrationFiles)
	if err != nil {
		t.Fatalf("loadMigrations() error = %v", err)
	}
	if len(migrations) != 2 {
		t.Fatalf("loaded %d migrations, want 2", len(migrations))
	}
	if migrations[0].version != 1 || migrations[0].name != "001_initial_schema.sql" {
		t.Errorf("first migration = (%d, %q), want (1, %q)", migrations[0].version, migrations[0].name, "001_initial_schema.sql")
	}
	if migrations[1].version != 2 || migrations[1].name != "002_optional_note_sections.sql" {
		t.Errorf("second migration = (%d, %q), want (2, %q)", migrations[1].version, migrations[1].name, "002_optional_note_sections.sql")
	}
}

func TestLoadMigrationsNormalizesCRLFLineEndings(t *testing.T) {
	crlfData := []byte("SELECT 1;\r\nSELECT 2;\r\n")
	lfData := []byte("SELECT 1;\nSELECT 2;\n")

	filesCRLF := fstest.MapFS{
		"sql/001_create_notes.sql": &fstest.MapFile{Data: crlfData},
	}
	filesLF := fstest.MapFS{
		"sql/001_create_notes.sql": &fstest.MapFile{Data: lfData},
	}

	migCRLF, err := loadMigrations(filesCRLF)
	if err != nil {
		t.Fatalf("loadMigrations(CRLF) error = %v", err)
	}
	migLF, err := loadMigrations(filesLF)
	if err != nil {
		t.Fatalf("loadMigrations(LF) error = %v", err)
	}

	if migCRLF[0].checksum != migLF[0].checksum {
		t.Errorf("checksum mismatch between CRLF and LF: %s != %s", migCRLF[0].checksum, migLF[0].checksum)
	}
}

func TestLoadMigrationsRejectsInvalidAndDuplicateVersions(t *testing.T) {
	tests := []struct {
		name  string
		files fstest.MapFS
	}{
		{
			name: "invalid filename",
			files: fstest.MapFS{
				"sql/add_notes.sql": &fstest.MapFile{Data: []byte("SELECT 1;")},
			},
		},
		{
			name: "duplicate version",
			files: fstest.MapFS{
				"sql/001_add_notes.sql":  &fstest.MapFile{Data: []byte("SELECT 1;")},
				"sql/001_add_topics.sql": &fstest.MapFile{Data: []byte("SELECT 2;")},
			},
		},
		{
			name: "empty migration",
			files: fstest.MapFS{
				"sql/001_add_notes.sql": &fstest.MapFile{Data: []byte(" \n")},
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if _, err := loadMigrations(test.files); err == nil {
				t.Fatal("loadMigrations() error = nil, want an error")
			}
		})
	}
}

func hashString(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:])
}

func TestPlanMigrations(t *testing.T) {
	m1 := migration{version: 1, name: "001_init.sql", checksum: hashString("1")}
	m2 := migration{version: 2, name: "002_cards.sql", checksum: hashString("2")}
	m3 := migration{version: 3, name: "003_tags.sql", checksum: hashString("3")}

	t.Run("fresh database returns all available migrations", func(t *testing.T) {
		available := []migration{m1, m2, m3}
		applied := map[int64]migration{}

		pending, err := planMigrations(available, applied)
		if err != nil {
			t.Fatalf("planMigrations() error = %v", err)
		}
		if len(pending) != 3 {
			t.Fatalf("got %d pending, want 3", len(pending))
		}
	})

	t.Run("all migrations already applied returns empty pending", func(t *testing.T) {
		available := []migration{m1, m2}
		applied := map[int64]migration{1: m1, 2: m2}

		pending, err := planMigrations(available, applied)
		if err != nil {
			t.Fatalf("planMigrations() error = %v", err)
		}
		if len(pending) != 0 {
			t.Fatalf("got %d pending, want 0", len(pending))
		}
	})

	t.Run("returns only pending migrations in order", func(t *testing.T) {
		available := []migration{m1, m2, m3}
		applied := map[int64]migration{1: m1}

		pending, err := planMigrations(available, applied)
		if err != nil {
			t.Fatalf("planMigrations() error = %v", err)
		}
		if len(pending) != 2 {
			t.Fatalf("got %d pending, want 2", len(pending))
		}
		if pending[0].version != 2 || pending[1].version != 3 {
			t.Errorf("unexpected pending versions: %d, %d", pending[0].version, pending[1].version)
		}
	})

	t.Run("fails when applied migration is missing from disk", func(t *testing.T) {
		available := []migration{m2, m3}
		applied := map[int64]migration{1: m1, 2: m2}

		_, err := planMigrations(available, applied)
		if err == nil {
			t.Fatal("planMigrations() want error for missing migration file, got nil")
		}
		if !strings.Contains(err.Error(), "missing") {
			t.Errorf("error %q does not mention missing", err.Error())
		}
	})

	t.Run("fails when applied migration checksum changed", func(t *testing.T) {
		m1Tampered := migration{version: 1, name: "001_init.sql", checksum: hashString("tampered")}
		available := []migration{m1Tampered, m2}
		applied := map[int64]migration{1: m1}

		_, err := planMigrations(available, applied)
		if err == nil {
			t.Fatal("planMigrations() want error for checksum mismatch, got nil")
		}
		if !strings.Contains(err.Error(), "changed") {
			t.Errorf("error %q does not mention changed", err.Error())
		}
	})

	t.Run("fails when applied migration name changed", func(t *testing.T) {
		m1Renamed := migration{version: 1, name: "001_renamed.sql", checksum: hashString("1")}
		available := []migration{m1Renamed, m2}
		applied := map[int64]migration{1: m1}

		_, err := planMigrations(available, applied)
		if err == nil {
			t.Fatal("planMigrations() want error for name mismatch, got nil")
		}
		if !strings.Contains(err.Error(), "changed") {
			t.Errorf("error %q does not mention changed", err.Error())
		}
	})

	t.Run("fails when pending migration is out-of-order", func(t *testing.T) {
		// Migration 3 was applied, but migration 2 is unapplied
		available := []migration{m1, m2, m3}
		applied := map[int64]migration{1: m1, 3: m3}

		_, err := planMigrations(available, applied)
		if err == nil {
			t.Fatal("planMigrations() want error for out-of-order migration, got nil")
		}
		if !strings.Contains(err.Error(), "out-of-order") {
			t.Errorf("error %q does not mention out-of-order", err.Error())
		}
	})
}

func TestHandlerApplyWithoutDB(t *testing.T) {
	handler := NewHandler(nil)
	req := httptest.NewRequest(http.MethodPost, "/api/migrations", nil)
	rec := httptest.NewRecorder()

	handler.Apply(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("status code = %d, want %d", rec.Code, http.StatusInternalServerError)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "migration_failed") {
		t.Errorf("response body %q does not contain migration_failed", body)
	}
}
