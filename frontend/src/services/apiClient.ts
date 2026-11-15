import {
  httpClient,
  defaultHttpClient,
  HttpClient,
  RequestOptions,
} from "./http/httpClient";
import { ApiError } from "./http/ApiError";

export type { RequestOptions };
export { ApiError, HttpClient, defaultHttpClient };

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  return await httpClient<T>(endpoint, options);
}
