import { cookies } from "next/headers";
import { apiClient } from "./apiClient";

export type LoginApiResponse = {
  user: {
    email: string;
    id: string;
  };
};

export type UserProfileResponse = {
  id: string;
  email: string;
  displayName?: string;
  emailVerified?: string | boolean;
  createdAt?: string;
};

export type GetCurrentResponse = {
  user: UserProfileResponse;
} | null;

// Aliases for backward compatibility
export type userProfileResponse = UserProfileResponse;
export type getCurrentResponse = GetCurrentResponse;

export async function getSession(): Promise<GetCurrentResponse> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  const cookieString = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  try {
    const data = await apiClient<GetCurrentResponse>(`/api/auth/me`, {
      headers: {
        Cookie: cookieString,
      },
      cache: "no-store",
    });

    if (!data?.user) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
