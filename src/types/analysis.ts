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

export type StepType =
  | "lineart" // 線画・下書き
  | "background" // 背景塗り
  | "skin" // 肌塗り
  | "clothing" // 服・衣装塗り
  | "hair" // 髪塗り
  | "accessories" // 小物・アクセサリー塗り
  | "details" // 細部・仕上げ
  | "main_part" // 主要部分塗り（複合）
  | "other"; // その他

export interface GeneratedStep {
  stepNumber: number;
  title: string;
  description: string;
  stepType: StepType;
  tips: string[];
  estimatedDuration: number;
  techniques: string[];
}

export interface StepGenerationResponse {
  steps: GeneratedStep[];
  totalEstimatedTime: number;
}
