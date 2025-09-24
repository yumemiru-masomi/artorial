/**
 * 色彩理論に基づく混色計算サービス
 * APIを使わずに数学的計算で混色レシピを生成
 */

import {
  FIXED_PAINT_PALETTE,
  ColorRecipeResponse,
  ColorRecipe,
} from "@/types/color-recipe";

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface LAB {
  l: number;
  a: number;
  b: number;
}

/**
 * 指定された色に最も近い混色レシピを計算で生成
 */
export function calculateColorRecipe(targetHex: string): ColorRecipeResponse {
  const targetRgb = hexToRgb(targetHex);
  const targetLab = rgbToLab(targetRgb);

  // 複数のアプローチで混色レシピを生成
  const recipes: ColorRecipe[] = [];

  // レシピ1: 最も近い2色の混合
  const twoColorRecipe = calculateTwoColorMix(targetHex, targetRgb, targetLab);
  if (twoColorRecipe) {
    recipes.push(twoColorRecipe);
  }

  // レシピ2: 3色混合（より複雑な色用）
  const threeColorRecipe = calculateThreeColorMix(
    targetHex,
    targetRgb,
    targetLab
  );
  if (threeColorRecipe) {
    recipes.push(threeColorRecipe);
  }

  return {
    target: targetHex,
    recipes: recipes.slice(0, 2), // 最大2レシピ
  };
}

/**
 * 2色混合レシピを計算
 */
function calculateTwoColorMix(
  targetHex: string,
  targetRgb: RGB,
  targetLab: LAB
): ColorRecipe | null {
  let bestMix: ColorRecipe | null = null;
  let bestError = Infinity;

  // 全ての2色組み合わせを試す
  for (let i = 0; i < FIXED_PAINT_PALETTE.length; i++) {
    for (let j = i + 1; j < FIXED_PAINT_PALETTE.length; j++) {
      const color1 = FIXED_PAINT_PALETTE[i];
      const color2 = FIXED_PAINT_PALETTE[j];

      // 最適な混合比率を計算（10%刻み）
      for (let ratio1 = 10; ratio1 <= 90; ratio1 += 10) {
        const ratio2 = 100 - ratio1;

        const mixedRgb = mixColors(
          hexToRgb(color1.hex),
          hexToRgb(color2.hex),
          ratio1 / 100
        );

        const mixedLab = rgbToLab(mixedRgb);
        const error = calculateColorDistance(targetLab, mixedLab);

        if (error < bestError) {
          bestError = error;
          const mixedHex = rgbToHex(mixedRgb);

          bestMix = {
            name: "best",
            mix: [
              { name: color1.name, hex: color1.hex, ratio: ratio1 },
              { name: color2.name, hex: color2.hex, ratio: ratio2 },
            ],
            order: [color1.name, color2.name],
            estimatedResultHex: mixedHex,
            estimatedError: {
              method: "delta_e_approx",
              value: Math.round(error * 10) / 10,
            },
            sentence_ja: generateMixingInstruction([
              { name: color1.name, ratio: ratio1 },
              { name: color2.name, ratio: ratio2 },
            ]),
          };
        }
      }
    }
  }

  return bestMix;
}

/**
 * 3色混合レシピを計算（より複雑な色用）
 */
function calculateThreeColorMix(
  targetHex: string,
  targetRgb: RGB,
  targetLab: LAB
): ColorRecipe | null {
  let bestMix: ColorRecipe | null = null;
  let bestError = Infinity;

  // 主要色の組み合わせのみを試す（計算量削減）
  const primaryColors = [
    FIXED_PAINT_PALETTE.find((p) => p.name === "ホワイト")!,
    FIXED_PAINT_PALETTE.find((p) => p.name === "ジェットブラック")!,
    FIXED_PAINT_PALETTE.find((p) => p.name === "パーマネントレッド")!,
    FIXED_PAINT_PALETTE.find((p) => p.name === "コバルトブルー")!,
    FIXED_PAINT_PALETTE.find((p) => p.name === "パーマネントイエロー")!,
  ];

  for (let i = 0; i < primaryColors.length; i++) {
    for (let j = i + 1; j < primaryColors.length; j++) {
      for (let k = j + 1; k < primaryColors.length; k++) {
        const color1 = primaryColors[i];
        const color2 = primaryColors[j];
        const color3 = primaryColors[k];

        // 簡単な比率パターンを試す
        const ratioPatterns = [
          [50, 30, 20],
          [40, 40, 20],
          [60, 25, 15],
          [45, 35, 20],
        ];

        for (const [r1, r2, r3] of ratioPatterns) {
          const rgb1 = hexToRgb(color1.hex);
          const rgb2 = hexToRgb(color2.hex);
          const rgb3 = hexToRgb(color3.hex);

          const mixedRgb = {
            r: Math.round((rgb1.r * r1 + rgb2.r * r2 + rgb3.r * r3) / 100),
            g: Math.round((rgb1.g * r1 + rgb2.g * r2 + rgb3.g * r3) / 100),
            b: Math.round((rgb1.b * r1 + rgb2.b * r2 + rgb3.b * r3) / 100),
          };

          const mixedLab = rgbToLab(mixedRgb);
          const error = calculateColorDistance(targetLab, mixedLab);

          if (error < bestError) {
            bestError = error;
            const mixedHex = rgbToHex(mixedRgb);

            bestMix = {
              name: "alt",
              mix: [
                { name: color1.name, hex: color1.hex, ratio: r1 },
                { name: color2.name, hex: color2.hex, ratio: r2 },
                { name: color3.name, hex: color3.hex, ratio: r3 },
              ],
              order: [color1.name, color2.name, color3.name],
              estimatedResultHex: mixedHex,
              estimatedError: {
                method: "delta_e_approx",
                value: Math.round(error * 10) / 10,
              },
              sentence_ja: generateMixingInstruction([
                { name: color1.name, ratio: r1 },
                { name: color2.name, ratio: r2 },
                { name: color3.name, ratio: r3 },
              ]),
            };
          }
        }
      }
    }
  }

  return bestMix;
}

/**
 * 2色を指定比率で混合
 */
function mixColors(rgb1: RGB, rgb2: RGB, ratio: number): RGB {
  return {
    r: Math.round(rgb1.r * ratio + rgb2.r * (1 - ratio)),
    g: Math.round(rgb1.g * ratio + rgb2.g * (1 - ratio)),
    b: Math.round(rgb1.b * ratio + rgb2.b * (1 - ratio)),
  };
}

/**
 * HEXをRGBに変換
 */
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * RGBをHEXに変換
 */
function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

/**
 * RGBをLAB色空間に変換（色差計算用）
 */
function rgbToLab(rgb: RGB): LAB {
  // RGB → XYZ → LAB変換（簡略版）
  let { r, g, b } = rgb;

  // 正規化
  r = r / 255;
  g = g / 255;
  b = b / 255;

  // ガンマ補正
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // XYZ変換
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  // LAB変換
  const fx = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  const fy = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  const fz = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * LAB色空間での色差を計算（ΔE近似）
 */
function calculateColorDistance(lab1: LAB, lab2: LAB): number {
  const deltaL = lab1.l - lab2.l;
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;

  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * 混色手順の日本語説明を生成
 */
function generateMixingInstruction(
  colors: { name: string; ratio: number }[]
): string {
  if (colors.length === 2) {
    const [color1, color2] = colors;
    if (color1.ratio > color2.ratio) {
      return `${color1.name}をベースに${color2.name}を${color2.ratio}%加えて混ぜます。`;
    } else {
      return `${color2.name}をベースに${color1.name}を${color1.ratio}%加えて混ぜます。`;
    }
  } else if (colors.length === 3) {
    const sorted = colors.sort((a, b) => b.ratio - a.ratio);
    return `${sorted[0].name}をベースに、${sorted[1].name}を${sorted[1].ratio}%、${sorted[2].name}を${sorted[2].ratio}%加えて混ぜます。`;
  }

  return "指定の比率で混色してください。";
}
