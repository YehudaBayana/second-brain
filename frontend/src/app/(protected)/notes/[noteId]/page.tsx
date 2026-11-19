import { Suspense } from "react";
import { ViewSkeleton } from "@/src/components/feedback/ViewSkeleton";
import { NoteDetailView } from "@/src/features/notes/components/NoteDetailView";

export default function NotePage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  return (
    <Suspense fallback={<ViewSkeleton view="library" />}>
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
