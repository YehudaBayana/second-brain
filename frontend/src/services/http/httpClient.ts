import { ApiError } from "./ApiError";
import { getCsrfToken } from "./csrf";

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipCsrf?: boolean;
}

/**
 * HttpClient
 * OOP Client for typed, robust HTTP communication.
 * Encapsulates URL resolution, header normalization, CSRF injection,
 * JSON serialization, and centralized ApiError mapping.
 */
export class HttpClient {
  private readonly defaultBaseUrl: string;

  constructor(baseUrl?: string) {
    this.defaultBaseUrl =
      baseUrl ??
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
      "http://localhost:8080";
  }

  public async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { params, headers, skipCsrf, ...customConfig } = options;

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url =
      endpoint.startsWith("http://") || endpoint.startsWith("https://")
        ? new URL(endpoint)
        : new URL(`${this.defaultBaseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const method =
      customConfig.method?.toUpperCase() || (customConfig.body ? "POST" : "GET");
    const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    const reqHeaders: HeadersInit = {
      ...headers,
    };

    if (
      customConfig.body &&
      !(customConfig.body instanceof FormData) &&
      !Object.keys(reqHeaders).some((h) => h.toLowerCase() === "content-type")
    ) {
      (reqHeaders as Record<string, string>)["Content-Type"] = "application/json";
    }

    if (isMutating && !skipCsrf && typeof document !== "undefined") {
      const csrf = getCsrfToken();
      if (csrf) {
        (reqHeaders as Record<string, string>)["X-CSRF-Token"] = csrf;
      }
    }

    const config: RequestInit = {
      method,
      credentials: "include",
      headers: reqHeaders,
      ...customConfig,
    };

    let response: Response;
    try {
      response = await fetch(url.toString(), config);
    } catch {
      throw new ApiError(
        0,
        "Could not reach the API. Check that the Go server is running.",
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message =
        errorData?.error?.message ??
        errorData?.error?.code ??
        errorData?.message ??
        `HTTP error! status: ${response.status}`;
      throw new ApiError(
        response.status,
        message,
        errorData?.error?.code ?? errorData?.code,
        errorData,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body:
        body !== undefined && !(body instanceof FormData)
          ? JSON.stringify(body)
          : (body as BodyInit | undefined),
    });
  }

  public put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body:
        body !== undefined && !(body instanceof FormData)
          ? JSON.stringify(body)
          : (body as BodyInit | undefined),
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const defaultHttpClient = new HttpClient();

/**
 * Functional wrapper for backward compatibility.
 */
export async function httpClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  return defaultHttpClient.request<T>(endpoint, options);
}
