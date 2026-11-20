import { useQuery } from "@tanstack/react-query";
import { fetchDatabaseTables } from "../api/tables";

export const databaseTablesQueryKey = (limit: number) =>
  ["database", "tables", limit] as const;

export function useDatabaseTables(limit: number) {
  return useQuery({
    queryKey: databaseTablesQueryKey(limit),
    queryFn: () => fetchDatabaseTables(limit),
  });
}
