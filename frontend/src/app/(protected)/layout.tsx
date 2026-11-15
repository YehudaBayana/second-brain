import { Suspense } from "react";
import { getSession } from "@/src/services/auth";
import { redirect } from "next/navigation";
import { AppShellLayout } from "@/src/components/layout/AppShellLayout";
import { AppShellSkeleton } from "@/src/components/feedback/AppShellSkeleton";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { authKeys } from "@/src/services/keys";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}

async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const queryClient = new QueryClient();
  queryClient.setQueryData(authKeys.me(), session);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AppShellLayout
        userEmail={session.user.email}
        currentDate={new Date().toISOString()}
      >
        {children}
      </AppShellLayout>
    </HydrationBoundary>
  );
}
