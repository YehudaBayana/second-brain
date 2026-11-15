import { Card, Flex, Skeleton, Stack } from "@mantine/core";

/**
 * AuthSkeleton
 * Skeleton placeholder for authentication pages to avoid text flash.
 */
export function AuthSkeleton() {
  return (
    <Flex mih="100vh" align="center" justify="center" p="md">
      <Card w={420} maw="100%">
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
    </Flex>
  );
}
