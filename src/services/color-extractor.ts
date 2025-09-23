/**
 * 画像から色を抽出する独立したサービス
 * Gemini APIに依存せず、Sharp.jsで高速に色抽出を行う
 */

import sharp from "sharp";

export interface ExtractedColor {
  hex: string;
  name: string;
  percentage: number;
}

/**
 * 画像から主要色を高速抽出（背景色を空間的に判定）
 */
export async function extractColorsFromBuffer(
  imageBuffer: Buffer
): Promise<ExtractedColor[]> {
  try {
    console.log("🎨 Sharp.jsによる背景重視色抽出開始");

    // 画像を適度なサイズにリサイズ（背景判定のため少し大きめ）
    const resizedBuffer = await sharp(imageBuffer)
      .resize(120, 120, { fit: "inside" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = resizedBuffer;
    const { width, height, channels } = info;

    // 全体の色の出現回数をカウント
    const allColorMap = new Map<string, number>();
    // 背景領域（画像の端）の色の出現回数をカウント
    const backgroundColorMap = new Map<string, number>();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * channels;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];

        // 粗い量子化で高速化
        const quantizedR = Math.floor(r / 8) * 8;
        const quantizedG = Math.floor(g / 8) * 8;
        const quantizedB = Math.floor(b / 8) * 8;

        const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;

        // 全体の色をカウント
        allColorMap.set(colorKey, (allColorMap.get(colorKey) || 0) + 1);

        // 背景領域の判定（画像の端から20%の領域）
        const edgeThreshold = Math.min(width, height) * 0.2;
        const isBackgroundRegion =
          x < edgeThreshold ||
          x > width - edgeThreshold ||
          y < edgeThreshold ||
          y > height - edgeThreshold;

        if (isBackgroundRegion) {
          backgroundColorMap.set(
            colorKey,
            (backgroundColorMap.get(colorKey) || 0) + 1
          );
        }
      }
    }

    // 背景色を特定（背景領域で最も多い色）
    const backgroundColors = Array.from(backgroundColorMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3); // 上位3色を背景色候補とする

    // 全体の色を取得
    const allColors = Array.from(allColorMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    const totalPixels = width * height;

    // 背景色を優先して結果を構築
    const colors: ExtractedColor[] = [];
    const processedColors = new Set<string>();

    // まず背景色を追加
    for (const [colorKey] of backgroundColors) {
      if (processedColors.has(colorKey)) continue;

      const [r, g, b] = colorKey.split(",").map(Number);
      const hex = `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
      const percentage = Math.round(
        ((allColorMap.get(colorKey) || 0) / totalPixels) * 100
      );

      colors.push({
        hex,
        name: getColorName(r, g, b) + "（背景）", // 背景色であることを明示
        percentage: Math.max(1, percentage),
      });
      processedColors.add(colorKey);
    }

    // 残りの色を追加
    for (const [colorKey, count] of allColors) {
      if (processedColors.has(colorKey) || colors.length >= 8) continue;

      const [r, g, b] = colorKey.split(",").map(Number);
      const hex = `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
      const percentage = Math.round((count / totalPixels) * 100);

      colors.push({
        hex,
        name: getColorName(r, g, b),
        percentage: Math.max(1, percentage),
      });
      processedColors.add(colorKey);
    }

    console.log("✅ 背景重視色抽出完了:", colors.length, "色");
    console.log("🎯 背景色候補:", backgroundColors.length, "色検出");
    return colors;
  } catch (error) {
    console.warn("⚠️ Sharp.js色抽出に失敗:", error);
    return getFallbackColors();
  }
}

/**
 * RGB値から色名を推定（高速版）
 */
function getColorName(r: number, g: number, b: number): string {
  // 基本色の高速判定
  if (r > 240 && g > 240 && b > 240) return "白";
  if (r < 30 && g < 30 && b < 30) return "黒";

  // グレー系
  if (Math.abs(r - g) < 40 && Math.abs(g - b) < 40) {
    if (r > 180) return "薄いグレー";
    if (r > 100) return "グレー";
    return "濃いグレー";
  }

  // 主要色の判定（高速版）
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  if (diff < 30) return "グレー系";

  if (r === max) {
    if (g > b + 30) return "オレンジ";
    if (b > g + 30) return "ピンク";
    return "赤";
  }

  if (g === max) {
    const greenDominance = g - Math.max(r, b);
    if (greenDominance > 20) {
      // 閾値を下げて検出しやすく
      if (r > g * 0.8 && b < g * 0.6) return "黄緑";
      if (b > g * 0.8 && r < g * 0.6) return "青緑";
      if (g > 180) return "明るい緑";
      if (g > 120) return "緑";
      return "濃い緑";
    }
    return "緑";
  }

  if (b === max) {
    if (g > r + 30) return "水色";
    if (r > g + 30) return "紫";
    return "青";
  }

  return "混合色";
}

/**
 * フォールバック用の基本色パレット
 */
function getFallbackColors(): ExtractedColor[] {
  return [
    { hex: "#8B4513", name: "茶色", percentage: 25 },
    { hex: "#228B22", name: "緑", percentage: 20 },
    { hex: "#4169E1", name: "青", percentage: 15 },
    { hex: "#FFFFFF", name: "白", percentage: 12 },
    { hex: "#000000", name: "黒", percentage: 10 },
    { hex: "#FF6347", name: "オレンジ", percentage: 8 },
    { hex: "#FFD700", name: "黄色", percentage: 6 },
    { hex: "#9370DB", name: "紫", percentage: 4 },
  ];
}
