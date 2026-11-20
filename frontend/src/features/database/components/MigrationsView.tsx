"use client";

import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/src/components/Icon";
import { rollbackMigrations } from "@/src/features/database/api/migrations";
import { useMigrationHistory } from "@/src/features/database/query/useMigrations";
import { RunMigrationsButton } from "./RunMigrationsButton";
import { useToastStore } from "@/src/store/useToastStore";
import { openConfirmDialog } from "@/src/utils/ConfirmAction";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function MigrationsView() {
  const historyQuery = useMigrationHistory();
  const queryClient = useQueryClient();
  const showSuccess = useToastStore((state) => state.success);
  const showError = useToastStore((state) => state.error);
  const [targetVersion, setTargetVersion] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const migrations = historyQuery.data?.migrations ?? [];
  const events = historyQuery.data?.events ?? [];
  const appliedMigrations = migrations.filter(
    (migration) => migration.status === "applied",
  );
  const currentVersion = appliedMigrations.at(-1)?.version ?? 0;
  const rollbackTargets = appliedMigrations
    .filter((migration) => migration.version < currentVersion)
    .reverse()
    .map((migration) => ({
      value: String(migration.version),
      label: `Version ${migration.version} - ${migration.name}`,
    }));
  if (currentVersion > 0) {
    rollbackTargets.push({ value: "0", label: "Version 0 - No migrations" });
  }
  const selectedTarget = targetVersion ?? rollbackTargets[0]?.value ?? null;

  const handleRollback = () => {
    if (selectedTarget === null) return;
    const version = Number(selectedTarget);
    const targetLabel =
      rollbackTargets.find((target) => target.value === selectedTarget)?.label ??
      `version ${version}`;
    const destructiveWarning =
      version === 0
        ? " Rolling back to version 0 will drop the application tables and permanently delete their data."
        : "";

    openConfirmDialog({
      title: `Roll back to ${targetLabel}?`,
      message: `All migrations newer than the selected version will be undone in reverse order.${destructiveWarning} This action cannot be undone without reapplying migrations.`,
      confirmLabel: "Roll back",
      onConfirm: () => {
        void (async () => {
          setIsRollingBack(true);
          try {
            const result = await rollbackMigrations(version);
            await queryClient.invalidateQueries();
            setTargetVersion(null);
            showSuccess(
              result.rolled_back.length === 0
                ? "The database is already at the selected version."
                : `Rolled back ${result.rolled_back.length} migration${result.rolled_back.length === 1 ? "" : "s"}.`,
            );
          } catch (error) {
            showError(
              error instanceof Error
                ? error.message
                : "Could not roll back database migrations.",
            );
          } finally {
            setIsRollingBack(false);
          }
        })();
      },
    });
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Stack gap="xs">
          <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
            Database
          </Text>
          <Title order={1}>Migrations</Title>
          <Text c="dimmed">
            Apply schema changes, roll back to an earlier version, and review
            every migration event.
          </Text>
        </Stack>
        <Group>
          <Button
            variant="default"
            onClick={() => void historyQuery.refetch()}
            loading={historyQuery.isFetching}
            leftSection={<Icon name="clock" size={16} />}
          >
            Refresh history
          </Button>
          <RunMigrationsButton />
        </Group>
      </Group>

      {historyQuery.error ? (
        <Alert color="red" variant="light" role="alert">
          Could not load migration history:{" "}
          {historyQuery.error instanceof Error
            ? historyQuery.error.message
            : "Unknown error"}
        </Alert>
      ) : null}

      <Paper>
        <Stack gap="md">
          <Group justify="space-between">
            <Stack gap={2}>
              <Title order={2} size="h3">
                Schema version
              </Title>
              <Text size="sm" c="dimmed">
                {currentVersion > 0
                  ? `Version ${currentVersion} is currently applied.`
                  : "No migrations are currently applied."}
              </Text>
            </Stack>
            <Badge color={currentVersion > 0 ? "green" : "gray"} variant="light">
              {currentVersion > 0 ? `v${currentVersion}` : "empty"}
            </Badge>
          </Group>

          <Group align="flex-end">
            <Select
              label="Roll back to version"
              description="All later migrations will be reversed."
              placeholder="No rollback available"
              data={rollbackTargets}
              value={selectedTarget}
              onChange={setTargetVersion}
              disabled={rollbackTargets.length === 0 || isRollingBack}
              searchable
              nothingFoundMessage="No previous versions"
              w={{ base: "100%", sm: 420 }}
            />
            <Button
              color="red"
              variant="light"
              onClick={handleRollback}
              disabled={selectedTarget === null || isRollingBack}
              loading={isRollingBack}
              leftSection={<Icon name="forgot" size={16} />}
            >
              Roll back
            </Button>
          </Group>
          {selectedTarget === "0" ? (
            <Alert color="orange" variant="light" title="Data-loss warning">
              Rolling back to version 0 removes all application tables and their
              data.
            </Alert>
          ) : null}
        </Stack>
      </Paper>

      <Paper>
        <Stack gap="md">
          <Title order={2} size="h3">
            Available migrations
          </Title>
          {historyQuery.isPending ? (
            <Text size="sm" c="dimmed">
              Loading migrations...
            </Text>
          ) : migrations.length === 0 ? (
            <Text size="sm" c="dimmed">
              No migrations found.
            </Text>
          ) : (
            <Table.ScrollContainer minWidth={620}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Version</Table.Th>
                    <Table.Th>Migration</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Applied at</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {migrations.map((migration) => (
                    <Table.Tr key={migration.version}>
                      <Table.Td>v{migration.version}</Table.Td>
                      <Table.Td>{migration.name}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            migration.status === "applied" ? "green" : "gray"
                          }
                          variant="light"
                        >
                          {migration.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {migration.applied_at
                          ? formatDate(migration.applied_at)
                          : "—"}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Stack>
      </Paper>

      <Paper>
        <Stack gap="md">
          <Title order={2} size="h3">
            Migration history
          </Title>
          {historyQuery.isPending ? (
            <Text size="sm" c="dimmed">
              Loading history...
            </Text>
          ) : events.length === 0 ? (
            <Text size="sm" c="dimmed">
              No migration events have been recorded yet.
            </Text>
          ) : (
            <Table.ScrollContainer minWidth={620}>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Time</Table.Th>
                    <Table.Th>Action</Table.Th>
                    <Table.Th>Version</Table.Th>
                    <Table.Th>Migration</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {events.map((event) => (
                    <Table.Tr key={event.id}>
                      <Table.Td>{formatDate(event.occurred_at)}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={event.action === "applied" ? "green" : "orange"}
                          variant="light"
                        >
                          {event.action === "applied" ? "Applied" : "Rolled back"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>v{event.version}</Table.Td>
                      <Table.Td>{event.name}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
