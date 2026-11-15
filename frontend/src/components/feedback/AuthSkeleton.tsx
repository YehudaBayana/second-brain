import { Box, Card, Skeleton, Stack } from "@mantine/core";

/**
 * AuthSkeleton
 * Skeleton placeholder for authentication pages to avoid text flash.
 */
export function AuthSkeleton() {
  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <Card style={{ width: 420, maxWidth: "100%", padding: "2rem" }}>
        <Stack gap="lg">
          <Stack gap="xs">
            <Skeleton height={28} width="60%" radius="sm" />
            <Skeleton height={14} width="80%" radius="xs" />
          </Stack>
          <Skeleton height={42} width="100%" radius="md" />
          <Skeleton height={42} width="100%" radius="md" />
          <Skeleton height={40} width="100%" radius="md" mt="sm" />
          <Skeleton height={14} width="50%" mx="auto" radius="xs" mt="sm" />
        </Stack>
      </Card>
    </Box>
  );
}
