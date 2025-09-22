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

// 色名から色カテゴリを推定する関数
export function categorizeColor(color: ColorInfo): ColorCategory[] {
  const name = color.name.toLowerCase();
  const hex = color.hex.toLowerCase();
  const categories: ColorCategory[] = [];

  // 背景色の判定
  if (
    name.includes("背景") ||
    name.includes("空") ||
    name.includes("青") ||
    name.includes("緑") ||
    name.includes("茶") ||
    name.includes("灰") ||
    color.percentage > 30 // 使用割合が高い色は背景色の可能性
  ) {
    categories.push("background");
  }

  // 肌色の判定
  if (
    name.includes("肌") ||
    name.includes("ベージュ") ||
    name.includes("薄い") ||
    name.includes("ピンク") ||
    (hex.startsWith("#f") && hex.length === 7) // 明るい色
  ) {
    categories.push("skin");
  }

  // 髪色の判定
  if (
    name.includes("髪") ||
    name.includes("茶色") ||
    name.includes("黒") ||
    name.includes("金") ||
    name.includes("銀")
  ) {
    categories.push("hair");
  }

  // 服・衣装色の判定
  if (
    name.includes("服") ||
    name.includes("衣装") ||
    name.includes("青") ||
    name.includes("赤") ||
    name.includes("緑") ||
    name.includes("紫") ||
    name.includes("黄") ||
    color.percentage > 15 // 中程度の使用割合
  ) {
    categories.push("clothing");
  }

  // アクセサリー・小物色の判定
  if (
    name.includes("アクセサリー") ||
    name.includes("小物") ||
    name.includes("金") ||
    name.includes("銀") ||
    name.includes("白") ||
    color.percentage < 10 // 使用割合が少ない色
  ) {
    categories.push("accessories");
  }

  // 細部・仕上げ色の判定（黒、白など）
  if (
    name.includes("黒") ||
    name.includes("白") ||
    hex === "#000000" ||
    hex === "#ffffff" ||
    name.includes("濃い") ||
    name.includes("薄い")
  ) {
    categories.push("details");
  }

  // カテゴリが見つからない場合はotherを追加
  if (categories.length === 0) {
    categories.push("other");
  }

  return categories;
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
