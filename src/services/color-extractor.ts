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

export class ColorExtractorService {
  /**
   * 画像から主要色を高速抽出（APIに依存しない）
   */
  async extractColorsFromBuffer(
    imageBuffer: Buffer
  ): Promise<ExtractedColor[]> {
    try {
      console.log("🎨 Sharp.jsによる高速色抽出開始");

      // 画像を小さくリサイズして処理を高速化（さらに小さく）
      const resizedBuffer = await sharp(imageBuffer)
        .resize(80, 80, { fit: "inside" }) // より小さくして高速化
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = resizedBuffer;
      const { width, height, channels } = info;

      // 色の出現回数をカウント（より粗い量子化で高速化）
      const colorMap = new Map<string, number>();

      for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 粗い量子化で高速化（32段階）
        const quantizedR = Math.floor(r / 8) * 8;
        const quantizedG = Math.floor(g / 8) * 8;
        const quantizedB = Math.floor(b / 8) * 8;

        const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
      }

      // 出現回数でソートして上位8色を取得
      const sortedColors = Array.from(colorMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);

      const totalPixels = width * height;

      const colors = sortedColors.map(([colorKey, count]) => {
        const [r, g, b] = colorKey.split(",").map(Number);
        const hex = `#${r.toString(16).padStart(2, "0")}${g
          .toString(16)
          .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
        const percentage = Math.round((count / totalPixels) * 100);

        return {
          hex,
          name: this.getColorName(r, g, b),
          percentage: Math.max(1, percentage),
        };
      });

      console.log("✅ Sharp.jsによる色抽出完了:", colors.length, "色");
      return colors;
    } catch (error) {
      console.warn("⚠️ Sharp.js色抽出に失敗:", error);
      return this.getFallbackColors();
    }
  }

  /**
   * RGB値から色名を推定（高速版）
   */
  private getColorName(r: number, g: number, b: number): string {
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
      if (r > b + 30) return "黄緑";
      if (b > r + 30) return "青緑";
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
  private getFallbackColors(): ExtractedColor[] {
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
}

export const colorExtractorService = new ColorExtractorService();
