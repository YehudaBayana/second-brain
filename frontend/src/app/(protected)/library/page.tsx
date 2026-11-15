import { HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { LibraryView } from "@/src/features/learning/components/LibraryView";
import { prefetchLearningPage } from "@/src/features/learning/server/prefetchLearningPage";
import { LearningViewSkeleton } from "@/src/components/feedback/LearningViewSkeleton";

export default function LibraryPage() {
  return (
    <Suspense fallback={<LearningViewSkeleton view="library" />}>
      <LibraryPageContent />
    </Suspense>
  );
}

async function LibraryPageContent() {
  const state = await prefetchLearningPage("library");

  return (
    <HydrationBoundary state={state}>
      <LibraryView />
    </HydrationBoundary>
  );
}
