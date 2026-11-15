"use client";

import {
  Alert,
  Button,
  Card,
  Flex,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useCredentialsForm } from "../hooks/useCredentialsForm";

export function RegisterForm() {
  const {
    email,
    password,
    setEmail,
    setPassword,
    handleSubmit,
    isSubmitting,
    error: registerError,
  } = useCredentialsForm("register");

  return (
    <Card w={420} maw="100%" padding="xl">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={2}>Create Account</Title>
          <Text c="dimmed" size="sm">
            Get started with your personal Second Brain
          </Text>
        </Stack>

        {registerError ? (
          <Alert color="red" variant="light" role="alert">
            <Text size="sm">
              {registerError instanceof Error
                ? registerError.message
                : "Failed to create account. Please try again."}
            </Text>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              id="register-email-input"
              label="Email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
              placeholder="you@example.com"
            />

            <PasswordInput
              id="register-password-input"
              label="Password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              placeholder="••••••••"
            />

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              mt="sm"
              
            >
              Create Account
            </Button>
          </Stack>
        </form>

        <Flex align="center" justify="center" gap="xs">
          <Text size="sm" c="dimmed">
            Already have an account?
          </Text>
          <Button component={Link} href="/auth/login" variant="subtle" size="sm">
            Sign in
          </Button>
        </Flex>
      </Stack>
    </Card>
  );
}

export default RegisterForm;
