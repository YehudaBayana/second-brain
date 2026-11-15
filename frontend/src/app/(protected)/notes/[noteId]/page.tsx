import { NoteDetailView } from "@/src/features/learning/components/NoteDetailView";

export default async function NotePage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;
  return <NoteDetailView noteId={noteId} />;
}
