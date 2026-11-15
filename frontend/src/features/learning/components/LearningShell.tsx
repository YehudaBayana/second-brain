"use client";

import type { ReactNode } from "react";
import { AppShellLayout } from "@/src/components/layout/AppShellLayout";
import type { Section } from "../model/types";

/**
 * LearningShell
 * Backward-compatible wrapper delegating to modern AppShellLayout.
 */
export function LearningShell({
  children,
  email,
}: {
  children: ReactNode;
  email?: string;
  section?: Section;
  dueToday?: number;
  working?: boolean;
  onNavigate?: (section: Section) => void;
  onSignOut?: () => void;
}) {
  return <AppShellLayout userEmail={email}>{children}</AppShellLayout>;
}

export default LearningShell;
