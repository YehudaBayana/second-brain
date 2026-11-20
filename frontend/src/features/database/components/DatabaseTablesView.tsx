"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDatabaseTables } from "../query/useDatabaseTables";
import type { TablePreview } from "../model/types";

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

interface DynamicSqlTableCardProps {
  table: TablePreview;
  viewMode: "rows" | "schema";
}

function DynamicSqlTableCard({ table, viewMode }: DynamicSqlTableCardProps) {
  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" align="center" mb="sm">
        <Group gap="sm">
          <Title order={4}>{table.tableName}</Title>
          <Badge variant="outline" color="gray">
            {table.columns.length}{" "}
            {table.columns.length === 1 ? "column" : "columns"}
          </Badge>
          {viewMode === "rows" && (
            <Badge variant="light" color="blue">
              {table.rows.length} {table.rows.length === 1 ? "row" : "rows"}
            </Badge>
          )}
        </Group>
      </Group>

      {viewMode === "schema" ? (
        table.columns.length === 0 ? (
          <Text c="dimmed" size="sm">
            This table has no columns.
          </Text>
        ) : (
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Column name</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {table.columns.map((column) => (
                <Table.Tr key={column}>
                  <Table.Td>
                    <Text size="sm" style={{ overflowWrap: "anywhere" }}>
                      {column}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )
      ) : table.rows.length === 0 ? (
        <Text c="dimmed" size="sm">
          This table has no rows.
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={600}>
          <Table
            striped
            highlightOnHover
            withTableBorder
            withColumnBorders
            layout="fixed"
            w="100%"
          >
            <Table.Thead>
              <Table.Tr>
                {table.columns.map((column) => (
                  <Table.Th
                    key={column}
                    title={column}
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {column}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {table.rows.map((row, rowIndex) => (
                <Table.Tr key={rowIndex}>
                  {table.columns.map((column) => {
                    const rawValue = row[column];
                    const isNull = rawValue === null || rawValue === undefined;
                    const value = formatCellValue(rawValue);
                    return (
                      <Table.Td key={column}>
                        <Text
                          size="sm"
                          c={isNull ? "dimmed" : undefined}
                          fs={isNull ? "italic" : undefined}
                          lineClamp={3}
                          title={value}
                          style={{ overflowWrap: "anywhere" }}
                        >
                          {value}
                        </Text>
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Paper>
  );
}

export function DatabaseTablesView() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"rows" | "schema">("rows");
  const {
    data: tables = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDatabaseTables(3);

  const filteredTables = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return tables;
    }
    return tables.filter((table) =>
      table.tableName.toLowerCase().includes(query),
    );
  }, [tables, search]);

  if (isLoading) {
    return (
      <Center h="50vh">
        <Loader />
      </Center>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <div>
            <Title order={2}>Database Tables</Title>
            <Text c="dimmed" size="sm">
              Browse columns or sample rows from the public schema
            </Text>
          </div>

          <Group gap="sm">
            <SegmentedControl
              aria-label="Table display mode"
              value={viewMode}
              onChange={(value) => {
                if (value === "rows" || value === "schema") {
                  setViewMode(value);
                }
              }}
              data={[
                { label: "Rows", value: "rows" },
                { label: "Schema", value: "schema" },
              ]}
            />
            <TextInput
              placeholder="Filter tables..."
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
            <Button
              variant="light"
              loading={isFetching}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </Group>
        </Group>

        {error && (
          <Alert color="red" title="Could not load tables">
            {error instanceof Error ? error.message : "Unknown error"}
          </Alert>
        )}

        {!error && filteredTables.length === 0 ? (
          <Paper withBorder p="xl" radius="md">
            <Text c="dimmed" ta="center">
              {tables.length === 0
                ? "No tables found in the database."
                : "No tables match your filter."}
            </Text>
          </Paper>
        ) : (
          <Stack gap="lg">
            {filteredTables.map((table) => (
              <DynamicSqlTableCard
                key={table.tableName}
                table={table}
                viewMode={viewMode}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
