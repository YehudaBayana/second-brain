import { Suspense } from "react";
import { getSession } from "@/src/services/auth";
import { redirect } from "next/navigation";
import { Box } from "@mantine/core";
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
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "var(--paper, #f7f7fb)",
      }}
    >
      {children}
    </Box>
  );
}
