"use client";

import { OverviewView } from "../components/OverviewView";

/**
 * LearningView
 * Thin composition view delegating to OverviewView.
 * Individual views are now first-class dedicated routes:
 * - / (Overview)
 * - /library (LibraryView)
 * - /review (ReviewView)
 * - /search (SearchView)
 */
export default function LearningView() {
  return <OverviewView />;
}

export { OverviewView };
