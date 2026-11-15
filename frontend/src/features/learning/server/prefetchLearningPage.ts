import { cookies } from "next/headers";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { LearningApiService } from "../api/LearningService";
import { learningKeys } from "@/src/services/keys";

type LearningPage = "overview" | "library" | "review";

export async function prefetchLearningPage(page: LearningPage) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  const requestOptions = {
    cache: "no-store" as const,
    headers: { Cookie: cookieHeader },
  };
  const learningService = new LearningApiService();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 0 } },
  });

  const queries = [
    ...(page === "overview" || page === "library"
      ? [
          queryClient.prefetchQuery({
            queryKey: learningKeys.notes(),
            queryFn: () => learningService.getNotes(requestOptions),
          }),
          queryClient.prefetchQuery({
            queryKey: learningKeys.topics(),
            queryFn: () => learningService.getTopics(requestOptions),
          }),
        ]
      : []),
    ...(page === "overview" || page === "library" || page === "review"
      ? [
          queryClient.prefetchQuery({
            queryKey: learningKeys.stats(),
            queryFn: () => learningService.getLearningStats(requestOptions),
          }),
        ]
      : []),
    ...(page === "review"
      ? [
          queryClient.prefetchQuery({
            queryKey: learningKeys.dueCards(),
            queryFn: () => learningService.getDueCards(requestOptions),
          }),
        ]
      : []),
  ];

  await Promise.all(queries);
  return dehydrate(queryClient);
}
