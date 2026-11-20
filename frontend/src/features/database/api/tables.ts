import { apiClient } from "@/src/services/apiClient";
import type { TablePreview } from "../model/types";

export function fetchDatabaseTables(limit: number): Promise<TablePreview[]> {
  return apiClient<TablePreview[]>(
    `/api/database/tables?limit=${encodeURIComponent(limit)}`,
  );
}
