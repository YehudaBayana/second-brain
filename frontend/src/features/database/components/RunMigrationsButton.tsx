"use client";

import { Button } from "@mantine/core";
import { useState } from "react";
import { useToastStore } from "@/src/store/useToastStore";
import { useRunMigrations } from "../query/useMigrations";

export function RunMigrationsButton() {
  const [isRunning, setIsRunning] = useState(false);
  const showSuccess = useToastStore((state) => state.success);
  const showError = useToastStore((state) => state.error);
  const { mutate: runMigrations } = useRunMigrations();

  const handleRun = async () => {
    setIsRunning(true);
    runMigrations(undefined, {
      onSuccess(result) {
        const count = result?.applied?.length ?? 0;
        showSuccess(
          count === 0
            ? "No pending database migrations."
            : `Applied ${count} database migration${count === 1 ? "" : "s"}.`,
        );
        setIsRunning(false);
      },
      onError(error) {
        showError(
          error instanceof Error
            ? error.message
            : "Could not run database migrations.",
        );
        setIsRunning(false);
      },
    });
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
