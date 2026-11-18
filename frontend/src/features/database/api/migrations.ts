import { apiClient } from "@/src/services/apiClient";

export interface AppliedMigration {
  version: number;
  name: string;
}

export interface MigrationResult {
  applied: AppliedMigration[];
}

export function runMigrations(): Promise<MigrationResult> {
  return apiClient<MigrationResult>("/api/migrations", { method: "POST" });
}
