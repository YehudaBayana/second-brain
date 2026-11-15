import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, login, logout, register } from "../api/auth";
import { authKeys } from "@/src/services/keys";
import { getCurrentResponse } from "@/src/services/auth";

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => register(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me(), null);
    },
  });
}

export function useGetCurrentUser() {
  return useQuery<getCurrentResponse>({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    retry: false,
  });
}
