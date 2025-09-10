'use client';

import { useState, useCallback } from 'react';
import { GeneratedStep } from '@/types/analysis';

interface UseTutorialReturn {
  currentStep: number;
  goToStep: (stepNumber: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  completedSteps: Set<number>;
  markStepAsCompleted: (stepNumber: number) => void;
  progress: number;
}

export function useTutorial(totalSteps: number): UseTutorialReturn {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const goToStep = useCallback((stepNumber: number) => {
    if (stepNumber >= 1 && stepNumber <= totalSteps) {
      setCurrentStep(stepNumber);
    }
  }, [totalSteps]);

  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      // 現在のステップを完了としてマーク
      setCompletedSteps(prev => new Set(prev.add(currentStep)));
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const markStepAsCompleted = useCallback((stepNumber: number) => {
    setCompletedSteps(prev => new Set(prev.add(stepNumber)));
  }, []);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const progress = (currentStep / totalSteps) * 100;

  return {
    currentStep,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    isFirstStep,
    isLastStep,
    completedSteps,
    markStepAsCompleted,
    progress,
  };
}