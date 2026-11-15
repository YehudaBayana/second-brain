import { Box, Paper, Skeleton } from "@mantine/core";

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
    <Box className={`${view}-view`} aria-busy="true">
      <Box className="page-heading">
        <Box style={{ flex: 1 }}>
          <Skeleton height={10} width={heading.eyebrow} radius="xs" mb="xs" />
          <Skeleton height={28} width={heading.title} radius="md" mb="xs" />
          <Skeleton
            height={14}
            width={heading.description}
            radius="sm"
          />
        </Box>
        {view === "overview" || view === "library" ? (
          <Skeleton height={36} width={130} radius="md" />
        ) : null}
      </Box>

      {view === "overview" ? (
        <>
          <Box className="stats-grid">
            {[1, 2, 3].map((item) => (
              <Paper key={item} className="stat-card">
                <Skeleton height={38} width={38} radius="md" mb="xs" />
                <Skeleton height={12} width={80} radius="sm" mb="xs" />
                <Skeleton height={26} width={40} radius="sm" mb="xs" />
                <Skeleton height={10} width={110} radius="xs" />
              </Paper>
            ))}
          </Box>
          <Box className="dashboard-columns">
            <Paper className="panel capture-panel">
              <Skeleton height={20} width={160} radius="sm" mb="md" />
              <Skeleton height={42} width="100%" radius="md" mb="md" />
              <Skeleton height={80} width="100%" radius="md" mb="md" />
              <Skeleton height={38} width="100%" radius="md" />
            </Paper>
            <Paper className="panel review-panel">
              <Skeleton height={20} width={140} radius="sm" mb="md" />
              <Skeleton height={24} width={180} radius="sm" mb="sm" />
              <Skeleton height={14} width="80%" radius="sm" mb="lg" />
              <Skeleton height={40} width="100%" radius="md" />
            </Paper>
          </Box>
        </>
      ) : null}

      {view === "library" ? (
        <Box className="notes-grid library-grid">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Box key={item} className="note-card" style={{ minHeight: 200 }}>
              <Skeleton height={18} width={80} radius="sm" mb="sm" />
              <Skeleton height={22} width="85%" radius="sm" mb="xs" />
              <Skeleton height={14} width="100%" radius="xs" mb="xs" />
              <Skeleton height={14} width="70%" radius="xs" mb="md" />
              <Skeleton height={32} width="100%" radius="sm" mt="auto" />
            </Box>
          ))}
        </Box>
      ) : null}

      {view === "review" ? (
        <Paper className="quiz-card" style={{ minHeight: 260 }}>
          <Skeleton height={20} width={100} radius="sm" mb="md" />
          <Skeleton height={28} width="70%" radius="sm" mb="xl" />
          <Skeleton height={42} width={180} radius="md" mx="auto" />
        </Paper>
      ) : null}

      {view === "search" ? (
        <Skeleton height={52} width="100%" radius="md" mb="xl" />
      ) : null}
    </Box>
  );
}
