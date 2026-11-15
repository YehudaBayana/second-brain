"use client";

import {
  Box,
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

export function LoginForm() {
  const {
    email,
    password,
    setEmail,
    setPassword,
    handleSubmit,
    isSubmitting,
    error: loginError,
  } = useCredentialsForm("login");

  return (
    <Card
      withBorder
      shadow="sm"
      p="xl"
      radius="md"
      style={{ width: 420, maxWidth: "100%" }}
    >
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={2}>Welcome Back</Title>
          <Text c="dimmed" size="sm">
            Please enter your details to sign in
          </Text>
        </Stack>

        {loginError ? (
          <Box className="error-banner" role="alert" p="xs">
            <Text size="sm">
              {loginError instanceof Error
                ? loginError.message
                : "Failed to sign in. Please check your credentials."}
            </Text>
          </Box>
        ) : null}

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              id="login-email-input"
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
              id="login-password-input"
              label="Password"
              autoComplete="current-password"
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
              className="button button-primary"
            >
              Sign In
            </Button>
          </Stack>
        </form>

        <Flex align="center" justify="center" gap="xs">
          <Text size="sm" c="dimmed">
            Don&apos;t have an account?
          </Text>
          <Button
            component={Link}
            href="/auth/register"
            variant="subtle"
            size="sm"
          >
            Sign up
          </Button>
        </Flex>
      </Stack>
    </Card>
  );
}

export default LoginForm;
