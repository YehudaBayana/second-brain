import { HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ReviewView } from "@/src/features/learning/components/ReviewView";
import { prefetchLearningPage } from "@/src/features/learning/server/prefetchLearningPage";
import { LearningViewSkeleton } from "@/src/components/feedback/LearningViewSkeleton";

export default function ReviewPage() {
  return (
    <Suspense fallback={<LearningViewSkeleton view="review" />}>
      <ReviewPageContent />
    </Suspense>
  );
}

async function ReviewPageContent() {
  const state = await prefetchLearningPage("review");

  return (
    <HydrationBoundary state={state}>
      <ReviewView />
    </HydrationBoundary>
  );
}
