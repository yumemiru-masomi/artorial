/**
 * 混色レシピ関連の型定義
 */

// 絵具の基本色情報
export interface PaintColor {
  name: string;
  hex: string;
}

// 混色レシピの各色と比率
export interface MixColor {
  name: string;
  hex: string;
  ratio: number; // パーセンテージ
}

// 混色の誤差情報
export interface ColorError {
  method: string;
  value: number;
}

// 混色レシピの詳細
export interface ColorRecipe {
  name: string; // "best" または "alt"
  mix: MixColor[];
  order: string[]; // 混ぜる順番
  estimatedResultHex: string;
  estimatedError: ColorError;
  sentence_ja: string; // 日本語の説明文
}

// Gemini APIからの混色レシピレスポンス
export interface ColorRecipeResponse {
  target: string; // ターゲット色のHEX
  recipes: ColorRecipe[];
}

// 固定パレット（12色の絵具）
export const FIXED_PAINT_PALETTE: PaintColor[] = [
  { name: "ホワイト", hex: "#FFFFFF" },
  { name: "パーマネントレッド", hex: "#AD0036" },
  { name: "コバルトブルー", hex: "#005EAD" },
  { name: "ジェットブラック", hex: "#001400" },
  { name: "バーナントシェナー", hex: "#864028" },
  { name: "バイオレット", hex: "#7F1084" },
  { name: "パーマネントイエロー", hex: "#FFF100" },
  { name: "パーマネントグリーンライト", hex: "#00A95F" },
  { name: "パーマネントグリーンミドル", hex: "#00703B" },
  { name: "パーマネントイエローディープ", hex: "#FBCE28" },
  { name: "パーマネントスカーレット", hex: "#C8002E" },
  { name: "スカイブルー", hex: "#007FC9" },
];
