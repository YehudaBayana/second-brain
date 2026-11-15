"use client";

import { useRouter } from "next/navigation";
import {
  useGetCurrentUser,
  useLogin,
  useLogout,
  useRegister,
} from "../query/useAuth";

/**
 * useAuth
 * Unified authentication hook providing user state, login, register, and signout flows.
 */
export function useAuth() {
  const currentUserQuery = useGetCurrentUser();
  const actions = useAuthActions();

  const user = currentUserQuery.data?.user ?? null;
  const isAuthenticated = Boolean(user);
  const isLoading = currentUserQuery.isPending;

  return {
    ...actions,
    user,
    isAuthenticated,
    isLoading,
  };
}

export function useAuthActions() {
  const router = useRouter();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const handleLogin = (credentials: {
    email: string;
    password: string;
  }) =>
    loginMutation.mutate(credentials, {
      onSuccess: () => router.replace("/"),
    });

  const handleRegister = (credentials: {
    email: string;
    password: string;
  }) =>
    registerMutation.mutate(credentials, {
      onSuccess: () => router.replace("/"),
    });

  const handleLogout = () =>
    logoutMutation.mutate(undefined, {
      onSuccess: () => router.replace("/auth/login"),
    });

  return {
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
}
