/**
 * 色のカテゴライズとステップマッピング
 */

import { ColorInfo, StepType } from "@/types/analysis";

// 色の分類カテゴリ
export type ColorCategory =
  | "background" // 背景色
  | "skin" // 肌色
  | "hair" // 髪色
  | "clothing" // 服・衣装色
  | "accessories" // 小物・アクセサリー色
  | "details" // 細部・仕上げ色（黒、白など）
  | "other"; // その他

// 色名から色カテゴリを推定する関数（優先度順）
export function categorizeColor(color: ColorInfo): ColorCategory[] {
  const name = color.name.toLowerCase();
  const hex = color.hex.toLowerCase();

  // 優先度1: 明示的な色名による分類
  if (name.includes("背景")) {
    return ["background"];
  }
  if (name.includes("肌")) {
    return ["skin"];
  }
  if (name.includes("髪")) {
    return ["hair"];
  }
  if (name.includes("服") || name.includes("衣装")) {
    return ["clothing"];
  }
  if (name.includes("アクセサリー") || name.includes("小物")) {
    return ["accessories"];
  }

  // 優先度2: 使用割合による背景色判定（最も重要）
  if (color.percentage > 35) {
    return ["background"];
  }

  // 優先度3: 色の特徴による分類
  // 細部・仕上げ色の判定（黒、白など）
  if (
    name.includes("黒") ||
    name.includes("白") ||
    hex === "#000000" ||
    hex === "#ffffff" ||
    name.includes("濃い") ||
    name.includes("薄い")
  ) {
    return ["details"];
  }

  // 肌色の判定
  if (
    name.includes("ベージュ") ||
    name.includes("ピンク") ||
    (hex.startsWith("#f") && hex.length === 7) // 明るい色
  ) {
    return ["skin"];
  }

  // 髪色の判定
  if (name.includes("茶色") || name.includes("金") || name.includes("銀")) {
    return ["hair"];
  }

  // 優先度4: 使用割合による分類
  if (color.percentage > 20) {
    // 高い使用割合の色は背景色の可能性が高い
    if (
      name.includes("空") ||
      name.includes("青") ||
      name.includes("緑") ||
      name.includes("茶") ||
      name.includes("灰")
    ) {
      return ["background"];
    }
    // その他の高使用割合色は服・衣装色
    return ["clothing"];
  }

  if (color.percentage > 10) {
    // 中程度の使用割合
    if (
      name.includes("青") ||
      name.includes("赤") ||
      name.includes("緑") ||
      name.includes("紫") ||
      name.includes("黄")
    ) {
      return ["clothing"];
    }
    return ["other"];
  }

  // 優先度5: 低使用割合の色
  if (color.percentage < 8) {
    if (name.includes("金") || name.includes("銀") || name.includes("白")) {
      return ["accessories"];
    }
  }

  // デフォルト
  return ["other"];
}

// ステップタイプに対応する色カテゴリのマッピング
export const STEP_COLOR_MAPPING: Record<StepType, ColorCategory[]> = {
  lineart: [], // 線画は色を使わない
  background: ["background"],
  skin: ["skin"],
  clothing: ["clothing"],
  hair: ["hair"],
  accessories: ["accessories"],
  details: ["details", "other"], // 細部は黒白など基本色を含む
  main_part: ["skin", "clothing", "hair"], // 主要部分は複数カテゴリ（背景除く）
  other: ["other"],
};

// ステップタイプに応じて色をフィルタリングする関数
export function getColorsForStep(
  stepType: StepType,
  allColors: ColorInfo[]
): ColorInfo[] {
  // 線画ステップの場合は色を返さない
  if (stepType === "lineart") {
    return [];
  }

  const targetCategories = STEP_COLOR_MAPPING[stepType] || ["other"];
  const filteredColors: ColorInfo[] = [];

  for (const color of allColors) {
    const colorCategories = categorizeColor(color);

    // 主要部分塗りの場合は背景色を明示的に除外
    if (stepType === "main_part" && colorCategories.includes("background")) {
      continue;
    }

    // ターゲットカテゴリのいずれかに該当する色を追加
    if (targetCategories.some((target) => colorCategories.includes(target))) {
      filteredColors.push(color);
    }
  }

  // フィルタリング結果が空の場合、背景色を除外した上位3色を返す
  if (filteredColors.length === 0) {
    const nonBackgroundColors = allColors.filter((color) => {
      const categories = categorizeColor(color);
      return !categories.includes("background");
    });
    return nonBackgroundColors.slice(0, 3);
  }

  // 使用割合でソート（降順）
  return filteredColors.sort((a, b) => b.percentage - a.percentage);
}

// ステップタイプの日本語名を取得
export function getStepTypeLabel(stepType: StepType): string {
  const labels: Record<StepType, string> = {
    lineart: "線画・下書き",
    background: "背景塗り",
    skin: "肌塗り",
    clothing: "服・衣装塗り",
    hair: "髪塗り",
    accessories: "小物・アクセサリー塗り",
    details: "細部・仕上げ",
    main_part: "主要部分塗り",
    other: "その他",
  };

  return labels[stepType] || stepType;
}
