import { DifficultyLevel } from './tutorial';

export interface ImageAnalysisRequest {
  imageUrl: string;
  material: string;
}

export interface ImageAnalysisResponse {
  difficulty: DifficultyLevel;
  complexity: number;
  subjects: string[];
  estimatedTime: number;
  reasoning: string;
  confidence: number;
}

export interface StepGenerationRequest {
  imageUrl: string;
  material: string;
  analysisResult: ImageAnalysisResponse;
}

export interface GeneratedStep {
  stepNumber: number;
  title: string;
  description: string;
  tips: string[];
  estimatedDuration: number;
  techniques: string[];
}

export interface StepGenerationResponse {
  steps: GeneratedStep[];
  totalEstimatedTime: number;
}