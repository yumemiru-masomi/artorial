import { DifficultyLevel } from "./tutorial";

export type ImageCategory =
  | "landscape" // 風景画
  | "portrait" // 人物画
  | "character" // キャラクター画
  | "still_life" // 静物画
  | "abstract" // 抽象画
  | "animal" // 動物画
  | "architecture" // 建築物
  | "other"; // その他

export interface ColorInfo {
  hex: string; // 16進数カラーコード (#RRGGBB)
  name: string; // 色の名前（日本語）
  percentage: number; // 画像内での使用割合 (0-100)
}

export interface ImageAnalysisRequest {
  imageUrl: string;
  material: string;
}

export interface ImageAnalysisResponse {
  difficulty: DifficultyLevel;
  complexity: number;
  estimatedTime: number;
  reasoning: string;
  category: ImageCategory;
  categoryDescription: string; // カテゴリの詳細説明
  dominantColors: ColorInfo[]; // 主要色（最大5色）
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
