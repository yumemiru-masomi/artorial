export type Material = "acrylic";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface AnalysisResult {
  id: string;
  difficulty: DifficultyLevel;
  complexity: number;
  subjects: string[];
  estimatedTime: number;
  reasoning: string;
  createdAt: Date;
}

export interface DrawingStep {
  stepNumber: number;
  title: string;
  description: string;
  tips: string[];
  referenceImageUrl: string;
  estimatedDuration: number;
}

export interface TutorialSession {
  id: string;
  originalImageUrl: string;
  material: Material;
  analysisResult: AnalysisResult;
  steps: DrawingStep[];
  currentStep: number;
  startedAt: Date;
  completedAt?: Date;
}
