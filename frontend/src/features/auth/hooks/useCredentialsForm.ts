"use client";

import { useState, type FormEvent } from "react";
import { useAuthActions } from "./useAuth";

type CredentialsFormMode = "login" | "register";

export function useCredentialsForm(mode: CredentialsFormMode) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const auth = useAuthActions();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) return;

    auth[mode]({ email, password });
  };

  return {
    email,
    password,
    setEmail,
    setPassword,
    handleSubmit,
    isSubmitting:
      mode === "login" ? auth.isLoggingIn : auth.isRegistering,
    error: mode === "login" ? auth.loginError : auth.registerError,
  };
}
