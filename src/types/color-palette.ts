import { Material } from './tutorial';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface ColorAnalysis {
  rgb: RGB;
  hsv: HSV;
  hex: string;
  colorName: string;
  frequency: number; // 画像内での出現頻度 (0-1)
}

export interface MixingRecipe {
  basicColors: Array<{
    name: string;
    ratio: number; // パーセンテージ
    hex: string;
  }>;
  steps: string[];
  materialSpecific?: {
    [key in Material]?: {
      technique: string;
      tips: string[];
      warnings?: string[];
    };
  };
}

export interface ColorDetail {
  analysis: ColorAnalysis;
  mixingRecipe: MixingRecipe;
  relatedColors: string[]; // 相性の良い色のHEXコード
}

export interface ColorPalette {
  colors: ColorAnalysis[];
  dominantColor: ColorAnalysis;
  complementaryColors: ColorAnalysis[];
  temperature: 'warm' | 'cool' | 'neutral';
  complexity: number; // 1-10のスケール
}

export interface ColorPaletteRequest {
  imageUrl: string;
  material: Material;
  maxColors?: number;
}

export interface ColorPaletteResponse {
  palette: ColorPalette;
  material: Material;
  extractionMethod: 'kmeans' | 'dominant' | 'fallback';
}