"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Button, Flex, Text } from "@mantine/core";
import { useGetCurrentUser } from "../../query/useAuth";
import { AppShellSkeleton } from "@/src/components/feedback/AppShellSkeleton";

interface RequireAuthProps {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isError, isPending, isLoading, refetch } = useGetCurrentUser();

  const unauthorized = !isLoading && !isPending && !isError && data === null;

  useEffect(() => {
    if (unauthorized) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, unauthorized]);

  if (isPending || unauthorized) {
    return <AppShellSkeleton />;
  }

  if (isError) {
    return (
      <Flex align="center" justify="center" gap="lg" p="xl" mih="100vh">
        <Text>Unable to verify your session. Please try again.</Text>
        <Button variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </Flex>
    );
  }

  if (!data?.user) {
    return null;
  }

  return <Box>{children}</Box>;
}
