import {
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
} from "@mantine/core";

type LearningViewSkeletonProps = {
  view: "overview" | "library" | "review" | "search";
};

const headingWidths = {
  overview: { eyebrow: 160, title: 280, description: 340 },
  library: { eyebrow: 160, title: 220, description: 300 },
  review: { eyebrow: 150, title: 240, description: 320 },
  search: { eyebrow: 180, title: 260, description: 340 },
} as const;

export function LearningViewSkeleton({ view }: LearningViewSkeletonProps) {
  const heading = headingWidths[view];

  return (
    <Stack gap="xl" aria-busy="true">
      <Group justify="space-between" align="flex-end">
        <Stack gap="xs" flex={1}>
          <Skeleton height={10} width={heading.eyebrow} radius="xs" mb="xs" />
          <Skeleton height={28} width={heading.title} radius="md" mb="xs" />
          <Skeleton height={14} width={heading.description} radius="sm" />
        </Stack>
        {view === "overview" || view === "library" ? (
          <Skeleton height={36} width={130} radius="md" />
        ) : null}
      </Group>

      {view === "overview" ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {[1, 2, 3].map((item) => (
              <Paper key={item}>
                <Group align="flex-start" gap="md">
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
            <Paper>
              <Stack gap="md">
                <Skeleton height={20} width={160} radius="sm" />
                <Skeleton height={42} width="100%" radius="md" />
                <Skeleton height={80} width="100%" radius="md" />
                <Skeleton height={38} width="100%" radius="md" />
              </Stack>
            </Paper>
            <Paper>
              <Stack gap="md">
                <Skeleton height={20} width={140} radius="sm" />
                <Skeleton height={24} width={180} radius="sm" />
                <Skeleton height={14} width="80%" radius="sm" />
                <Skeleton height={40} width="100%" radius="md" />
              </Stack>
            </Paper>
          </SimpleGrid>
        </>
      ) : null}

      {view === "library" ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Paper key={item} mih={200}>
              <Stack gap="sm">
                <Skeleton height={18} width={80} radius="sm" />
                <Skeleton height={22} width="85%" radius="sm" />
                <Skeleton height={14} width="100%" radius="xs" />
                <Skeleton height={14} width="70%" radius="xs" />
                <Skeleton height={32} width="100%" radius="sm" mt="auto" />
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      ) : null}

      {view === "review" ? (
        <Paper mih={260}>
          <Stack gap="md">
            <Skeleton height={20} width={100} radius="sm" />
            <Skeleton height={28} width="70%" radius="sm" />
            <Skeleton height={42} width={180} radius="md" mx="auto" />
          </Stack>
        </Paper>
      ) : null}

      {view === "search" ? (
        <Paper>
          <Skeleton height={52} width="100%" radius="md" />
        </Paper>
      ) : null}
    </Stack>
  );
}
