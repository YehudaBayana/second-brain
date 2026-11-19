import { HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { OverviewView } from "@/src/features/dashboard/components/OverviewView";
import { prefetchDashboardPage } from "@/src/features/dashboard/server/prefetchDashboardPage";
import { ViewSkeleton } from "@/src/components/feedback/ViewSkeleton";

export default function OverviewPage() {
  return (
    <Suspense fallback={<ViewSkeleton view="overview" />}>
      <OverviewPageContent />
    </Suspense>
  );
}

async function OverviewPageContent() {
  const state = await prefetchDashboardPage("overview");

  return (
    <HydrationBoundary state={state}>
      <OverviewView />
    </HydrationBoundary>
  );
}
