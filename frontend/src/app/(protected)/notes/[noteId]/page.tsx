import { Suspense } from "react";
import { LearningViewSkeleton } from "@/src/components/feedback/LearningViewSkeleton";
import { NoteDetailView } from "@/src/features/learning/components/NoteDetailView";

export default function NotePage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  return (
    <Suspense fallback={<LearningViewSkeleton view="library" />}>
      <NotePageContent params={params} />
    </Suspense>
  );
}

async function NotePageContent({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;
  return <NoteDetailView noteId={noteId} />;
}
