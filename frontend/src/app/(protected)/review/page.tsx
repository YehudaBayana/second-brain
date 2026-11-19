import { HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ReviewView } from "@/src/features/review/components/ReviewView";
import { prefetchDashboardPage } from "@/src/features/dashboard/server/prefetchDashboardPage";
import { ViewSkeleton } from "@/src/components/feedback/ViewSkeleton";

export default function ReviewPage() {
  return (
    <Suspense fallback={<ViewSkeleton view="review" />}>
      <ReviewPageContent />
    </Suspense>
  );
}

async function ReviewPageContent() {
  const state = await prefetchDashboardPage("review");

  return (
    <HydrationBoundary state={state}>
      <ReviewView />
    </HydrationBoundary>
  );
}
