"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flex } from "@mantine/core";
import { LoginForm } from "../../components/LoginForm";
import { useAuth } from "../../hooks/useAuth";
import { AuthSkeleton } from "@/src/components/feedback/AuthSkeleton";

export default function AuthView() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (user?.id) {
      router.replace("/");
    }
  }, [user?.id, router]);

  if (isLoading) {
    return <AuthSkeleton />;
  }

  return (
    <Flex align="center" justify="center" mih="100vh" p="md">
      <LoginForm />
    </Flex>
  );
}
