import { HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { OverviewView } from "@/src/features/learning/components/OverviewView";
import { prefetchLearningPage } from "@/src/features/learning/server/prefetchLearningPage";
import { LearningViewSkeleton } from "@/src/components/feedback/LearningViewSkeleton";

export default function OverviewPage() {
  return (
    <Suspense fallback={<LearningViewSkeleton view="overview" />}>
      <OverviewPageContent />
    </Suspense>
  );
}

async function OverviewPageContent() {
  const state = await prefetchLearningPage("overview");

  return (
    <HydrationBoundary state={state}>
      <OverviewView />
    </HydrationBoundary>
  );
}
