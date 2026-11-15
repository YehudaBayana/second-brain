import { Box, Paper, Skeleton } from "@mantine/core";
import { Icon } from "@/src/features/learning/components/Icon";

/**
 * AppShellSkeleton
 * High-fidelity layout skeleton that exactly mirrors the real Second Brain application shell.
 * Prevents layout shift and eliminates "Loading..." text flash during server rendering and route transitions.
 */
export function AppShellSkeleton() {
  return (
    <Box className="app-shell" aria-busy="true" aria-label="Loading workspace">
      {/* Sidebar Skeleton */}
      <Box component="aside" className="sidebar">
        <Box className="brand">
          <Box className="brand-mark">
            <Icon name="book" size={21} />
          </Box>
          <Box style={{ width: 90, height: 18 }}>
            <Skeleton height={18} width="100%" radius="sm" />
          </Box>
        </Box>

        <Skeleton height={10} width={90} radius="xs" mb="sm" />

        <Box component="nav" className="main-nav">
          {[1, 2, 3, 4].map((item) => (
            <Box
              key={item}
              className="nav-item"
              style={{ pointerEvents: "none", opacity: 0.7 }}
            >
              <Skeleton height={18} width={18} circle />
              <Skeleton height={14} width="60%" radius="sm" />
            </Box>
          ))}
        </Box>

        <Box className="sidebar-bottom">
          <Box className="sidebar-tip">
            <Skeleton height={12} width="50%" radius="sm" mb="xs" />
            <Skeleton height={10} width="90%" radius="xs" mb={4} />
            <Skeleton height={10} width="75%" radius="xs" />
          </Box>

          <Box className="account-row">
            <Skeleton height={28} width={28} circle />
            <Skeleton height={14} width={120} radius="sm" />
          </Box>
        </Box>
      </Box>

      {/* Main Panel Skeleton */}
      <Box component="main" className="main-panel">
        <Box component="header" className="topbar">
          <Skeleton height={14} width={160} radius="sm" />
          <Skeleton height={14} width={120} radius="sm" />
        </Box>

        <Box className="content-wrap">
          {/* Page Heading Skeleton */}
          <Box className="page-heading">
            <Box style={{ flex: 1 }}>
              <Skeleton height={10} width={140} radius="xs" mb="xs" />
              <Skeleton height={28} width={280} radius="md" mb="xs" />
              <Skeleton height={14} width={340} radius="sm" />
            </Box>
            <Skeleton height={36} width={130} radius="md" />
          </Box>

          {/* Stats Grid Skeleton */}
          <Box className="stats-grid">
            {[1, 2, 3].map((card) => (
              <Paper key={card} className="stat-card">
                <Skeleton height={38} width={38} radius="md" mb="xs" />
                <Skeleton height={12} width={80} radius="sm" mb="xs" />
                <Skeleton height={26} width={40} radius="sm" mb="xs" />
                <Skeleton height={10} width={110} radius="xs" />
              </Paper>
            ))}
          </Box>

          {/* Dashboard Columns Skeleton */}
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
        </Box>

        <Box component="footer" className="app-footer">
          <Skeleton height={12} width={180} radius="xs" />
          <Skeleton height={12} width={80} radius="xs" />
        </Box>
      </Box>
    </Box>
  );
}
