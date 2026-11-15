import { httpClient, RequestOptions } from "./http/httpClient";
import { ApiError } from "./http/ApiError";
export type { RequestOptions };
export { ApiError };

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  return await httpClient<T>(endpoint, options);
}
