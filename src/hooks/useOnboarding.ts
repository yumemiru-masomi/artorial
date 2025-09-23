"use client";

import { useState, useEffect } from "react";

const ONBOARDING_STORAGE_KEY = "artorial_onboarding_completed";

export function useOnboarding() {
  const [isOnboardingCompleted, setIsOnboardingCompleted] =
    useState<boolean>(true); // デフォルトはtrueで隠す
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // クライアントサイドでのみ実行
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    setIsOnboardingCompleted(completed === "true");
    setIsLoading(false);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsOnboardingCompleted(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setIsOnboardingCompleted(false);
  };

  return {
    isOnboardingCompleted,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}
