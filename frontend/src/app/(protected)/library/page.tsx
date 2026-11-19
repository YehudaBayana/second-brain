import { HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { LibraryView } from "@/src/features/notes/components/LibraryView";
import { prefetchDashboardPage } from "@/src/features/dashboard/server/prefetchDashboardPage";
import { ViewSkeleton } from "@/src/components/feedback/ViewSkeleton";

export default function LibraryPage() {
  return (
    <Suspense fallback={<ViewSkeleton view="library" />}>
      <LibraryPageContent />
    </Suspense>
  );
}

async function LibraryPageContent() {
  const state = await prefetchDashboardPage("library");

  return (
    <HydrationBoundary state={state}>
      <LibraryView />
    </HydrationBoundary>
  );
}
