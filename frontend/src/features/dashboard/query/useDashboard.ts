import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../api/DashboardService";
import { dashboardKeys } from "@/src/services/keys";

export function useLearningStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardService.getLearningStats(),
  });
}
