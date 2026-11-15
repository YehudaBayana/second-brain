import {
  defaultHttpClient,
  HttpClient,
} from "@/src/services/apiClient";
import type { GetCurrentResponse, LoginApiResponse } from "@/src/services/auth";

/**
 * AuthApiService
 * OOP Service encapsulating authentication operations (login, register, logout, session query).
 */
export class AuthApiService {
  constructor(private readonly http: HttpClient = defaultHttpClient) {}

  public login(email: string, password: string): Promise<LoginApiResponse> {
    return this.http.post<LoginApiResponse>("/api/auth/login", {
      email,
      password,
    });
  }

  public register(email: string, password: string): Promise<LoginApiResponse> {
    return this.http.post<LoginApiResponse>("/api/auth/register", {
      email,
      password,
    });
  }

  public logout(): Promise<void> {
    return this.http.post<void>("/api/auth/logout");
  }

  public getCurrentUser(): Promise<GetCurrentResponse> {
    return this.http.get<GetCurrentResponse>("/api/auth/me");
  }
}

export const authApiService = new AuthApiService();
