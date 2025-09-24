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

// 色名から色カテゴリを推定する関数（優先度順・単一カテゴリ返却）
export function categorizeColor(color: ColorInfo): ColorCategory[] {
  const name = color.name.toLowerCase();
  const hex = color.hex.toLowerCase();

  // 優先度1: 明示的な色名による分類（最優先）
  if (name.includes("背景") || name.includes("（背景）")) {
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

  // 優先度2: 使用割合による背景色判定（背景明示色以外）
  if (
    color.percentage > 40 &&
    !name.includes("オレンジ") &&
    !name.includes("茶")
  ) {
    // 動物の毛色（オレンジ・茶系）は背景色から除外
    return ["background"];
  }

  // 優先度3: 黒色の特別処理
  if (
    name.includes("黒") ||
    hex === "#000000" ||
    parseInt(hex.slice(1), 16) < 0x202020
  ) {
    return ["details"];
  }

  // 優先度4: 白色の処理
  if (
    name.includes("白") ||
    hex === "#ffffff" ||
    (hex.startsWith("#f") && parseInt(hex.slice(1), 16) > 0xf0f0f0)
  ) {
    // 白色は使用割合に応じて分類
    if (color.percentage > 25) {
      return ["background"]; // 高使用割合の白は背景色
    }
    return ["details"]; // 低使用割合の白は細部
  }

  // 優先度5: 色名と使用割合による背景色判定
  if (color.percentage > 25) {
    // 背景色として一般的な色
    if (
      name.includes("緑") ||
      name.includes("青") ||
      name.includes("茶") ||
      name.includes("ベージュ") ||
      name.includes("灰") ||
      name.includes("空") ||
      name.includes("オレンジ")
    ) {
      return ["background"];
    }
    // その他の高使用割合色も背景色として扱う
    return ["background"];
  }

  // 優先度6: 肌色・髪色の判定
  if (
    name.includes("ベージュ") ||
    name.includes("ピンク") ||
    name.includes("肌色")
  ) {
    return ["skin"];
  }

  if (name.includes("茶色") || name.includes("金") || name.includes("銀")) {
    return ["hair"];
  }

  // 優先度7: 中程度の使用割合による分類
  if (color.percentage > 15) {
    // 服・衣装色として分類
    if (
      name.includes("青") ||
      name.includes("赤") ||
      name.includes("緑") ||
      name.includes("紫") ||
      name.includes("黄") ||
      name.includes("オレンジ")
    ) {
      return ["clothing"];
    }
    return ["clothing"];
  }

  // 優先度8: 低使用割合の色
  if (color.percentage > 5) {
    if (name.includes("金") || name.includes("銀")) {
      return ["accessories"];
    }
    return ["other"];
  }

  // デフォルト
  return ["details"];
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
  allColors: ColorInfo[],
  stepColors?: import("@/types/analysis").StepColors
): ColorInfo[] {
  // 線画ステップの場合は色を返さない
  if (stepType === "lineart") {
    return [];
  }

  // Geminiが分類したstepColorsを優先的に使用
  if (stepColors) {
    switch (stepType) {
      case "background":
        if (stepColors.background.length > 0) {
          return stepColors.background;
        }
        break;
      case "main_part":
      case "skin":
      case "clothing":
      case "hair":
        if (stepColors.main_part.length > 0) {
          return stepColors.main_part;
        }
        break;
      case "details":
      case "accessories":
        if (stepColors.details.length > 0) {
          return stepColors.details;
        }
        break;
    }
  }

  // フォールバック: 従来のロジック
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
