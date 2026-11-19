import { cookies } from "next/headers";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { NotesService } from "@/src/features/notes/api/NotesService";
import { ReviewService } from "@/src/features/review/api/ReviewService";
import { DashboardService } from "../api/DashboardService";
import { dashboardKeys, noteKeys, topicKeys, reviewKeys } from "@/src/services/keys";

type DashboardPage = "overview" | "library" | "review";

export async function prefetchDashboardPage(page: DashboardPage) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  const requestOptions = {
    cache: "no-store" as const,
    headers: { Cookie: cookieHeader },
  };
  const notesService = new NotesService();
  const reviewService = new ReviewService();
  const dashboardService = new DashboardService();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 0 } },
  });

  const queries = [
    ...(page === "overview" || page === "library"
      ? [
          queryClient.prefetchQuery({
            queryKey: noteKeys.list(),
            queryFn: () => notesService.getNotes(requestOptions),
          }),
          queryClient.prefetchQuery({
            queryKey: topicKeys.list(),
            queryFn: () => notesService.getTopics(requestOptions),
          }),
        ]
      : []),
    ...(page === "overview" || page === "library" || page === "review"
      ? [
          queryClient.prefetchQuery({
            queryKey: dashboardKeys.stats(),
            queryFn: () => dashboardService.getLearningStats(requestOptions),
          }),
        ]
      : []),
    ...(page === "review"
      ? [
          queryClient.prefetchQuery({
            queryKey: reviewKeys.dueCards(),
            queryFn: () => reviewService.getDueCards(requestOptions),
          }),
        ]
      : []),
  ];

  await Promise.all(queries);
  return dehydrate(queryClient);
}
