"use client";

import {
  Anchor,
  AppShell,
  Box,
  Burger,
  Button,
  Group,
  Text,
  useAppShellResize,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/src/features/learning/components/Icon";
import { useLearningStats } from "@/src/features/learning/query/useLearning";
import { useAuth } from "@/src/features/auth/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badgeKey?: "dueToday";
}

const navItems: NavItem[] = [
  { href: "/", label: "Overview", icon: "home" },
  { href: "/library", label: "My library", icon: "library" },
  {
    href: "/review",
    label: "Review cards",
    icon: "cards",
    badgeKey: "dueToday",
  },
  { href: "/search", label: "Search", icon: "search" },
];

const routeLabels: Record<string, string> = {
  "/": "Overview",
  "/library": "My library",
  "/review": "Review cards",
  "/search": "Search",
};

interface AppShellLayoutProps {
  children: ReactNode;
  userEmail?: string;
  currentDate?: string;
}

/**
 * AppShellLayout
 * Core application shell providing layout, navigation, dynamic breadcrumbs,
 * and user profile info. Uses Next.js native routing and usePathname()
 * to eliminate props drilling and conditional rendering.
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
  const resize = useAppShellResize({
    navbar: { min: 200, max: 500 },
    header: { min: 48, max: 120 },
  });

  const email = userEmail || user?.email || "user@secondbrain.app";
  const dueToday = stats?.dueToday ?? 0;

  const currentLabel =
    routeLabels[pathname] ??
    Object.entries(routeLabels).find(
      ([route]) => route !== "/" && pathname.startsWith(route),
    )?.[1] ??
    "Workspace";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
      resize={resize}
    >
      <AppShell.Header className="topbar app-shell-header">
        <Group h="100%" px="md" justify="space-between">
          <Group h="100%" gap="md">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label={opened ? "Close navigation" : "Open navigation"}
            />
            <Text className="breadcrumbs">
              Your workspace <Text component="span">/</Text>{" "}
              <Text component="strong">{currentLabel}</Text>
            </Text>
          </Group>
          <Group gap="md">
            {currentDate ? (
              <Text className="topbar-date">
                {new Intl.DateTimeFormat("en", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                }).format(new Date(currentDate))}
              </Text>
            ) : null}
            <Button
              onClick={resize.resetAll}
              variant="default"
              size="xs"
              className="reset-layout-button"
            >
              Reset layout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="sidebar" p="md">
        <Anchor
          component={Link}
          className="brand"
          href="/"
          aria-label="Second Brain home"
        >
          <Box className="brand-mark">
            <Icon name="book" size={21} />
          </Box>
          <Text component="span">
            second
            <Text component="span" className="brand-light">
              brain
            </Text>
          </Text>
        </Anchor>

        <Text className="nav-caption">YOUR WORKSPACE</Text>

        <Box component="nav" className="main-nav" aria-label="Main navigation">
          {navItems.map(({ href, label, icon, badgeKey }) => {
            const active = isActive(href);
            return (
              <Anchor
                component={Link}
                key={href}
                href={href}
                className={`nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                aria-label={label}
              >
                <Icon name={icon} />
                <Text component="span">{label}</Text>
                {badgeKey === "dueToday" && dueToday > 0 ? (
                  <Text component="span" className="nav-count">
                    {dueToday}
                  </Text>
                ) : null}
              </Anchor>
            );
          })}
        </Box>

        <Box className="sidebar-bottom">
          <Box className="sidebar-tip">
            <Box className="tip-icon">
              <Icon name="sparkle" size={17} />
            </Box>
            <Text component="strong">Little by little</Text>
            <Text>
              Ten focused minutes today beats an hour of cramming later.
            </Text>
          </Box>

          <Box className="account-row">
            <Text component="span" className="avatar">
              {email.slice(0, 1).toUpperCase()}
            </Text>
            <Text component="span" className="account-email" title={email}>
              {email}
            </Text>
            <Button
              className="icon-button logout-button"
              onClick={() => logout()}
              aria-label="Sign out"
              title="Sign out"
              disabled={isLoggingOut}
              variant="subtle"
            >
              <Icon name="logout" />
            </Button>
          </Box>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main className="main-panel">
        <Box className="content-wrap app-shell-content-wrap">{children}</Box>

        <Box component="footer" className="app-footer app-shell-footer">
          <Text component="span">Keep learning, one idea at a time.</Text>
          <Text component="span">Second Brain</Text>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}

export default AppShellLayout;
