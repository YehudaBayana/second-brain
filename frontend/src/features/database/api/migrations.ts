import { apiClient } from "@/src/services/apiClient";

export interface AppliedMigration {
  version: number;
  name: string;
}

export interface MigrationResult {
  applied: AppliedMigration[];
}

export interface MigrationHistoryItem extends AppliedMigration {
  status: "applied" | "pending";
  applied_at?: string;
}

export interface MigrationEvent extends AppliedMigration {
  id: number;
  action: "applied" | "rolled_back";
  occurred_at: string;
}

export interface MigrationHistory {
  migrations: MigrationHistoryItem[];
  events: MigrationEvent[];
}

export interface RollbackResult {
  rolled_back: AppliedMigration[];
}

export function getMigrationHistory(): Promise<MigrationHistory> {
  return apiClient<MigrationHistory>("/api/migrations");
}

export function runMigrations(): Promise<MigrationResult> {
  return apiClient<MigrationResult>("/api/migrations", { method: "POST" });
}

export function rollbackMigrations(targetVersion: number): Promise<RollbackResult> {
  return apiClient<RollbackResult>("/api/migrations/rollback", {
    method: "POST",
    body: JSON.stringify({ target_version: targetVersion }),
  });
}
