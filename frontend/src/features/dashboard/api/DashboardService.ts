import { defaultHttpClient, type HttpClient } from "@/src/services/apiClient";
import type { RequestOptions } from "@/src/services/apiClient";
import type { LearningStats } from "../model/types";

export class DashboardService {
  constructor(private readonly http: HttpClient = defaultHttpClient) {}

  getLearningStats(options?: RequestOptions): Promise<LearningStats> {
    return this.http.get<LearningStats>("/api/stats", options);
  }
}

export const dashboardService = new DashboardService();
