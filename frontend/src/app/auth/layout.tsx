import { Suspense } from "react";
import { getSession } from "@/src/services/auth";
import { redirect } from "next/navigation";
import { Flex } from "@mantine/core";
import { AuthSkeleton } from "@/src/components/feedback/AuthSkeleton";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <UnauthenticatedLayout>{children}</UnauthenticatedLayout>
    </Suspense>
  );
}

async function UnauthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session?.user) {
    redirect("/");
  }

  return (
    <Flex mih="100vh" align="center" justify="center" p="md" bg="gray.0">
      {children}
    </Flex>
  );
}
