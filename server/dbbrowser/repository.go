package dbbrowser

import (
	"context"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ListTablePreviews fetches up to `limit` rows from every base table in the public schema.
func (r *Repository) ListTablePreviews(ctx context.Context, limit int) ([]TablePreview, error) {
	if limit <= 0 {
		limit = 10
	}

	const tablesSQL = `
		SELECT table_name
		FROM information_schema.tables
		WHERE table_schema = 'public'
		  AND table_type = 'BASE TABLE'
		ORDER BY table_name ASC;
	`

	tableRows, err := r.pool.Query(ctx, tablesSQL)
	if err != nil {
		return nil, fmt.Errorf("query table names: %w", err)
	}

	tableNames, err := pgx.CollectRows(tableRows, pgx.RowTo[string])
	if err != nil {
		return nil, fmt.Errorf("collect table names: %w", err)
	}

	if len(tableNames) == 0 {
		return []TablePreview{}, nil
	}

	previews := make([]TablePreview, len(tableNames))
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	var (
		wg       sync.WaitGroup
		errOnce  sync.Once
		firstErr error
		sem      = make(chan struct{}, 5)
	)

	for i, tableName := range tableNames {
		wg.Add(1)
		go func(idx int, tbl string) {
			defer wg.Done()

			select {
			case sem <- struct{}{}:
				defer func() { <-sem }()
			case <-ctx.Done():
				return
			}

			preview, err := r.fetchSingleTable(ctx, tbl, limit)
			if err != nil {
				errOnce.Do(func() {
					firstErr = err
					cancel()
				})
				return
			}

			previews[idx] = preview
		}(i, tableName)
	}

	wg.Wait()
	if firstErr != nil {
		return nil, firstErr
	}

	return previews, nil
}

func (r *Repository) fetchSingleTable(ctx context.Context, tableName string, limit int) (TablePreview, error) {
	safeTable := pgx.Identifier{tableName}.Sanitize()
	query := fmt.Sprintf("SELECT * FROM %s LIMIT $1", safeTable)

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return TablePreview{}, fmt.Errorf("query table %s: %w", tableName, err)
	}

	fieldDescriptions := rows.FieldDescriptions()
	columns := make([]string, len(fieldDescriptions))
	for i, fd := range fieldDescriptions {
		columns[i] = string(fd.Name)
	}

	rowData, err := pgx.CollectRows(rows, pgx.RowToMap)
	if err != nil {
		return TablePreview{}, fmt.Errorf("collect rows for %s: %w", tableName, err)
	}

	if rowData == nil {
		rowData = []map[string]any{}
	}

	return TablePreview{
		TableName: tableName,
		Columns:   columns,
		Rows:      rowData,
	}, nil
}
