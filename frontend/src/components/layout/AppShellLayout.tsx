"use client";

import {
  Anchor,
  AppShell,
  Avatar,
  Burger,
  Button,
  Group,
  Stack,
  Text,
  useAppShellResize,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/src/components/Icon";
import { StudyAssistantPanel } from "@/src/features/assistant/components/StudyAssistantPanel";
import { StudyAssistantProvider } from "@/src/features/assistant/components/StudyAssistantContext";
import { useLearningStats } from "@/src/features/dashboard/query/useDashboard";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import NavMenuItem, { NavItem } from "./NavMenuItem";

const navItems: NavItem[] = [
  { href: "/", label: "Overview", icon: "home" },
  { href: "/library", label: "Notes", icon: "library" },
  {
    href: "/review",
    label: "Review cards",
    icon: "cards",
    badgeKey: "dueToday",
    children: [
      { href: "/review?status=pending", label: "Pending flashcards" },
      { href: "/review?status=all", label: "All flashcards" },
    ],
  },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/migrations", label: "Migrations", icon: "database" },
  { href: "/database", label: "DB", icon: "database" },
];

const routeLabels: Record<string, string> = {
  "/": "Overview",
  "/library": "notes",
  "/review": "Review cards",
  "/review?status=pending": "Pending flashcards",
  "/review?status=all": "All flashcards",
  "/search": "Search",
  "/migrations": "Migrations",
};

interface AppShellLayoutProps {
  children: ReactNode;
  userEmail?: string;
  currentDate?: string;
}

/**
- AppShellLayout
- Core application shell providing layout, navigation, dynamic breadcrumbs,
- and user profile info. Uses Next.js native routing and usePathname()
- to eliminate props drilling and conditional rendering.
 */
export function AppShellLayout({
  children,
  userEmail,
  currentDate,
}: AppShellLayoutProps) {
  const pathname = usePathname();
  const { data: stats } = useLearningStats();
  const { user, logout, isLoggingOut } = useAuth();
  const [opened, { toggle }] = useDisclosure();
  const [assistantOpened, assistantDisclosure] = useDisclosure(false);
  const resize = useAppShellResize({
    navbar: { min: 200, max: 500 },
    header: { min: 48, max: 120 },
  });

  const email = userEmail || user?.email || "user@secondbrain.app";
  const dueToday = stats?.dueToday ?? 0;

  const currentLabel =
    routeLabels[pathname] ??
    (pathname.startsWith("/notes/") ? "Study note" : undefined) ??
    Object.entries(routeLabels).find(
      ([route]) => route !== "/" && pathname.startsWith(route),
    )?.[1] ??
    "Workspace";

  return (
    <AppShell
      bg="gray.0"
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
      resize={resize}
    >
      <AppShell.Header bg="white">
        <Group h="100%" px={{ base: "sm", sm: "lg" }} justify="space-between">
          <Group h="100%" gap="md">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label={opened ? "Close navigation" : "Open navigation"}
            />
            <Text size="sm" c="dimmed">
              Your workspace <Text component="span">/</Text>{" "}
              <Text component="span" fw={600} c="dark">
                {currentLabel}
              </Text>
            </Text>
          </Group>
          <Group gap="xs">
            {currentDate ? (
              <Text size="sm" c="dimmed" visibleFrom="sm">
                {new Intl.DateTimeFormat("en", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                }).format(new Date(currentDate))}
              </Text>
            ) : null}
            <Button onClick={resize.resetAll} variant="default" size="xs">
              Reset layout
            </Button>
            <Button
              onClick={assistantDisclosure.toggle}
              variant="filled"
              size="xs"
              aria-expanded={assistantOpened}
              aria-controls="study-assistant-panel"
              leftSection={<Icon name="sparkle" size={14} />}
            >
              Save something new
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar bg="white" p="md">
        <Stack h="100%" gap="md">
          <Anchor
            component={Link}
            href="/"
            underline="never"
            aria-label="Second Brain home"
          >
            <Group gap="sm" mb="md">
              <Avatar color="indigo" radius="md" size="md">
                <Icon name="book" size={20} />
              </Avatar>
              <Text fw={700} size="lg" c="dark">
                second
                <Text component="span" c="indigo.7">
                  brain
                </Text>
              </Text>
            </Group>
          </Anchor>

          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            Your workspace
          </Text>

          <Stack component="nav" gap={4} aria-label="Main navigation">
            {navItems.map((item) => (
              <NavMenuItem
                key={item.href}
                item={item}
                pathname={pathname}
                dueToday={dueToday}
              />
            ))}
          </Stack>

          <Stack mt="auto" gap="md">
            <Group gap="sm" wrap="nowrap">
              <Avatar color="indigo" radius="xl" size="sm">
                {email.slice(0, 1).toUpperCase()}
              </Avatar>
              <Text size="sm" truncate="end" title={email} flex={1}>
                {email}
              </Text>
              <Button
                onClick={() => logout()}
                aria-label="Sign out"
                title="Sign out"
                disabled={isLoggingOut}
                variant="subtle"
                color="gray"
                size="xs"
              >
                <Icon name="logout" />
              </Button>
            </Group>
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Stack maw={1280} mx="auto" gap="xl" p={{ base: "md", md: "xl" }}>
          <StudyAssistantProvider value={assistantDisclosure.open}>
            {children}
          </StudyAssistantProvider>

          <Group component="footer" justify="space-between" c="dimmed" fz="xs">
            <Text size="xs">Keep learning, one idea at a time.</Text>
            <Text size="xs">Second Brain</Text>
          </Group>
        </Stack>
      </AppShell.Main>

      <StudyAssistantPanel
        id="study-assistant-panel"
        opened={assistantOpened}
        onClose={assistantDisclosure.close}
      />
    </AppShell>
  );
}

export default AppShellLayout;
