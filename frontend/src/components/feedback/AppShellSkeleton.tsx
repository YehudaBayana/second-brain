"use client";

import {
  AppShell,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
} from "@mantine/core";

export function AppShellSkeleton() {
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm" }}
      padding="md"
      bg="gray.0"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <AppShell.Header bg="white">
        <Group h="100%" px="lg" justify="space-between">
          <Skeleton height={14} width={180} radius="sm" />
          <Group gap="sm">
            <Skeleton height={14} width={120} radius="sm" />
            <Skeleton height={32} width={120} radius="md" />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar bg="white" p="md">
        <Stack h="100%" gap="md">
          <Group gap="sm" mb="md">
            <Skeleton height={36} width={36} radius="md" />
            <Skeleton height={18} width={110} radius="sm" />
          </Group>
          <Skeleton height={10} width={100} radius="xs" />
          <Stack component="nav" gap="sm" aria-label="Loading navigation">
            {[1, 2, 3, 4].map((item) => (
              <Group key={item} gap="sm" aria-hidden="true">
                <Skeleton height={18} width={18} circle />
                <Skeleton height={14} width="60%" radius="sm" />
              </Group>
            ))}
          </Stack>
          <Stack mt="auto" gap="md">
            <Paper p="md" bg="indigo.0">
              <Stack gap="sm">
                <Skeleton height={12} width="50%" radius="sm" />
                <Skeleton height={10} width="90%" radius="xs" />
                <Skeleton height={10} width="75%" radius="xs" />
              </Stack>
            </Paper>
            <Group gap="sm">
              <Skeleton height={28} width={28} circle />
              <Skeleton height={14} width={140} radius="sm" />
            </Group>
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Stack maw={1280} mx="auto" p="xl" gap="xl">
          <Group justify="space-between" align="flex-end">
            <Stack gap="sm" flex={1}>
              <Skeleton height={10} width={140} radius="xs" />
              <Skeleton height={28} width={280} radius="md" />
              <Skeleton height={14} width={340} radius="sm" />
            </Stack>
            <Skeleton height={36} width={130} radius="md" />
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {[1, 2, 3].map((card) => (
              <Paper key={card}>
                <Group gap="md">
                  <Skeleton height={44} width={44} radius="md" />
                  <Stack gap="xs">
                    <Skeleton height={12} width={80} radius="sm" />
                    <Skeleton height={26} width={40} radius="sm" />
                    <Skeleton height={10} width={110} radius="xs" />
                  </Stack>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
            {[1, 2].map((card) => (
              <Paper key={card}>
                <Stack gap="md">
                  <Skeleton height={20} width={160} radius="sm" />
                  <Skeleton height={42} width="100%" radius="md" />
                  <Skeleton height={80} width="100%" radius="md" />
                  <Skeleton height={38} width="100%" radius="md" />
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>

          <Group component="footer" justify="space-between">
            <Skeleton height={12} width={180} radius="xs" />
            <Skeleton height={12} width={80} radius="xs" />
          </Group>
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}
