"use client";

import { Button } from "@mantine/core";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { runMigrations } from "@/src/features/database/api/migrations";
import { useToastStore } from "@/src/store/useToastStore";

export function RunMigrationsButton() {
  const [isRunning, setIsRunning] = useState(false);
  const showSuccess = useToastStore((state) => state.success);
  const showError = useToastStore((state) => state.error);
  const queryClient = useQueryClient();

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const result = await runMigrations();
      const count = result?.applied?.length ?? 0;
      if (count > 0) {
        await queryClient.invalidateQueries();
      }
      showSuccess(
        count === 0
          ? "No pending database migrations."
          : `Applied ${count} database migration${count === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Could not run database migrations.",
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button
      onClick={handleRun}
      variant="default"
      size="xs"
      loading={isRunning}
      disabled={isRunning}
      aria-label="Run database migrations"
    >
      Run migrations
    </Button>
  );
}
