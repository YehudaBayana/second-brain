package infrastructure

import (
	"context"
	"fmt"

	"github.com/YehudaBayana/second-brain/server/dbmigrate"
	"github.com/jackc/pgx/v5/pgxpool"
)

func ConnectDatabase(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("create database pool: %w", err)
	}
	if err := db.Ping(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("connect to database: %w", err)
	}
	if _, err := dbmigrate.NewHandler(db).ApplyMigrations(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("apply database migrations: %w", err)
	}
	return db, nil
}
