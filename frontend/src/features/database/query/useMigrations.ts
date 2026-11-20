"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { migrationKeys } from "@/src/services/keys";
import { getMigrationHistory, runMigrations } from "../api/migrations";

export const migrationQueries = {
  history: () => ({
    queryKey: migrationKeys.history(),
    queryFn: getMigrationHistory,
  }),
};

export function useMigrationHistory() {
  return useQuery(migrationQueries.history());
}

export function useRunMigrations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runMigrations,
    onSuccess: async (result) => {
      const count = result?.applied?.length ?? 0;
      if (count > 0) {
        await queryClient.invalidateQueries();
      }
    },
  });
}
