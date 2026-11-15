"use client";

import { createContext, useContext } from "react";

const StudyAssistantContext = createContext<(() => void) | null>(null);

export const StudyAssistantProvider = StudyAssistantContext.Provider;

export function useOpenStudyAssistant() {
  const openAssistant = useContext(StudyAssistantContext);
  if (!openAssistant) {
    throw new Error("StudyAssistantProvider is missing");
  }
  return openAssistant;
}
