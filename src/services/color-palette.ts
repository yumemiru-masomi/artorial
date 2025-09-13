import { Material } from '@/types/tutorial';
import { 
  RGB, 
  HSV, 
  ColorAnalysis, 
  MixingRecipe, 
  ColorPalette,
  ColorPaletteResponse 
} from '@/types/color-palette';
// Sharp import is conditional to avoid client-side bundling issues
let sharp: typeof import('sharp') | null = null;
if (typeof window === 'undefined') {
  // Only import sharp on server-side
  sharp = require('sharp'); // eslint-disable-line @typescript-eslint/no-require-imports
}

export class ColorPaletteService {
  /**
   * メイン処理: 画像からカラーパレットを抽出
   */
  async extractColorPalette(
    imageBuffer: Buffer,
    material: Material,
    maxColors: number = 8
  ): Promise<ColorPaletteResponse> {
    try {
      // K-means クラスタリングによる色抽出を試行
      const kmeansColors = await this.extractColorsKMeans(imageBuffer, maxColors);
      const palette = this.buildColorPalette(kmeansColors);
      
      return {
        palette,
        material,
        extractionMethod: 'kmeans'
      };
    } catch (kmeansError) {
      console.warn('K-means extraction failed, falling back to dominant colors:', kmeansError);
      
      try {
        // フォールバック: ドミナントカラー抽出
        const dominantColors = await this.extractDominantColors(imageBuffer, maxColors);
        const palette = this.buildColorPalette(dominantColors);
        
        return {
          palette,
          material,
          extractionMethod: 'dominant'
        };
      } catch (dominantError) {
        console.warn('Dominant color extraction failed, using fallback:', dominantError);
        
        // 最終フォールバック: 基本的なカラーパレット
        const fallbackColors = this.getFallbackColors();
        const palette = this.buildColorPalette(fallbackColors);
        
        return {
          palette,
          material,
          extractionMethod: 'fallback'
        };
      }
    }
  }

  /**
   * K-meansクラスタリングによる色抽出（簡易実装）
   */
  private async extractColorsKMeans(imageBuffer: Buffer, k: number): Promise<ColorAnalysis[]> {
    if (!sharp) {
      throw new Error('Sharp is not available (server-side only)');
    }
    
    // 画像をRGB配列に変換
    const { data, info } = await sharp(imageBuffer)
      .resize(200, 200, { fit: 'cover' }) // 処理速度向上のためリサイズ
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels: RGB[] = [];
    for (let i = 0; i < data.length; i += info.channels) {
      pixels.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      });
    }

    // 簡易K-meansアルゴリズム
    const clusters = this.simpleKMeans(pixels, k);
    
    return clusters.map((cluster) => ({
      rgb: cluster.centroid,
      hsv: this.rgbToHsv(cluster.centroid),
      hex: this.rgbToHex(cluster.centroid),
      colorName: this.getColorName(cluster.centroid),
      frequency: cluster.size / pixels.length,
    }));
  }

  /**
   * 簡易K-meansクラスタリング実装
   */
  private simpleKMeans(pixels: RGB[], k: number): Array<{ centroid: RGB; size: number }> {
    // 初期中心点をランダムに選択
    const centroids: RGB[] = [];
    for (let i = 0; i < k; i++) {
      const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
      centroids.push({ ...randomPixel });
    }

    let iterations = 0;
    const maxIterations = 20;

    while (iterations < maxIterations) {
      const clusters: Array<{ pixels: RGB[]; centroid: RGB }> = centroids.map(c => ({
        pixels: [],
        centroid: c,
      }));

      // 各ピクセルを最も近い中心点に割り当て
      for (const pixel of pixels) {
        let minDistance = Infinity;
        let closestCluster = 0;

        for (let i = 0; i < centroids.length; i++) {
          const distance = this.colorDistance(pixel, centroids[i]);
          if (distance < minDistance) {
            minDistance = distance;
            closestCluster = i;
          }
        }

        clusters[closestCluster].pixels.push(pixel);
      }

      // 新しい中心点を計算
      let changed = false;
      for (let i = 0; i < clusters.length; i++) {
        if (clusters[i].pixels.length === 0) continue;

        const newCentroid = this.calculateCentroid(clusters[i].pixels);
        if (this.colorDistance(newCentroid, centroids[i]) > 1) {
          centroids[i] = newCentroid;
          changed = true;
        }
      }

      if (!changed) break;
      iterations++;
    }

    // 結果を返す
    return centroids.map((centroid, i) => ({
      centroid,
      size: pixels.filter(p => {
        let minDistance = Infinity;
        let closestIndex = 0;
        
        for (let j = 0; j < centroids.length; j++) {
          const distance = this.colorDistance(p, centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = j;
          }
        }
        
        return closestIndex === i;
      }).length,
    }));
  }

  /**
   * ドミナントカラー抽出（フォールバック）
   */
  private async extractDominantColors(imageBuffer: Buffer, maxColors: number): Promise<ColorAnalysis[]> {
    if (!sharp) {
      throw new Error('Sharp is not available (server-side only)');
    }
    
    const { dominant } = await sharp(imageBuffer).stats();
    
    // 基本的な色分布分析
    const colors: ColorAnalysis[] = [];
    
    // ドミナントカラーを追加
    const dominantRgb: RGB = {
      r: Math.round(dominant.r),
      g: Math.round(dominant.g),
      b: Math.round(dominant.b),
    };
    
    colors.push({
      rgb: dominantRgb,
      hsv: this.rgbToHsv(dominantRgb),
      hex: this.rgbToHex(dominantRgb),
      colorName: this.getColorName(dominantRgb),
      frequency: 0.4, // 推定値
    });

    // 基本的な色のバリエーションを生成
    for (let i = 1; i < maxColors; i++) {
      const variation = this.generateColorVariation(dominantRgb, i);
      colors.push({
        rgb: variation,
        hsv: this.rgbToHsv(variation),
        hex: this.rgbToHex(variation),
        colorName: this.getColorName(variation),
        frequency: Math.max(0.1, 0.4 - i * 0.05),
      });
    }

    return colors;
  }

  /**
   * フォールバックカラーパレット
   */
  private getFallbackColors(): ColorAnalysis[] {
    const basicColors = [
      { r: 200, g: 100, b: 100 }, // 赤系
      { r: 100, g: 150, b: 200 }, // 青系
      { r: 150, g: 180, b: 100 }, // 緑系
      { r: 220, g: 180, b: 120 }, // 黄系
      { r: 150, g: 120, b: 180 }, // 紫系
      { r: 180, g: 140, b: 100 }, // 茶系
      { r: 120, g: 120, b: 120 }, // グレー系
      { r: 240, g: 240, b: 240 }, // ライト系
    ];

    return basicColors.map((rgb, index) => ({
      rgb,
      hsv: this.rgbToHsv(rgb),
      hex: this.rgbToHex(rgb),
      colorName: this.getColorName(rgb),
      frequency: Math.max(0.05, 0.3 - index * 0.03),
    }));
  }

  /**
   * カラーパレットオブジェクトを構築
   */
  private buildColorPalette(colors: ColorAnalysis[]): ColorPalette {
    // 頻度でソート
    const sortedColors = colors.sort((a, b) => b.frequency - a.frequency);
    
    const dominantColor = sortedColors[0];
    const complementaryColors = this.getComplementaryColors(dominantColor);
    const temperature = this.determineTemperature(sortedColors);
    const complexity = this.calculateComplexity(sortedColors);

    return {
      colors: sortedColors,
      dominantColor,
      complementaryColors,
      temperature,
      complexity,
    };
  }

  /**
   * 混色レシピを生成
   */
  generateMixingRecipe(color: ColorAnalysis, material: Material): MixingRecipe {
    const { rgb } = color;
    
    // 基本色からの混色比率を計算
    const basicColors = this.calculateBasicColorMixture(rgb);
    
    // ステップを生成
    const steps = this.generateMixingSteps(basicColors, material);
    
    // 画材別の技法情報
    const materialSpecific = this.getMaterialSpecificTechniques(color, material);

    return {
      basicColors,
      steps,
      materialSpecific: {
        [material]: materialSpecific,
      },
    };
  }

  // ユーティリティメソッド
  private colorDistance(a: RGB, b: RGB): number {
    return Math.sqrt(
      Math.pow(a.r - b.r, 2) +
      Math.pow(a.g - b.g, 2) +
      Math.pow(a.b - b.b, 2)
    );
  }

  private calculateCentroid(pixels: RGB[]): RGB {
    const sum = pixels.reduce(
      (acc, pixel) => ({
        r: acc.r + pixel.r,
        g: acc.g + pixel.g,
        b: acc.b + pixel.b,
      }),
      { r: 0, g: 0, b: 0 }
    );

    return {
      r: Math.round(sum.r / pixels.length),
      g: Math.round(sum.g / pixels.length),
      b: Math.round(sum.b / pixels.length),
    };
  }

  private rgbToHsv(rgb: RGB): HSV {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : Math.round((diff / max) * 100);
    const v = Math.round(max * 100);

    return { h, s, v };
  }

  private rgbToHex(rgb: RGB): string {
    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toLowerCase();
  }

  private getColorName(rgb: RGB): string {
    // 簡易的な色名判定
    const { h, s, v } = this.rgbToHsv(rgb);
    
    if (v < 20) return '黒';
    if (v > 80 && s < 20) return '白';
    if (s < 20) return 'グレー';
    
    if (h < 15 || h >= 345) return '赤';
    if (h < 45) return 'オレンジ';
    if (h < 75) return '黄';
    if (h < 165) return '緑';
    if (h < 195) return 'シアン';
    if (h < 255) return '青';
    if (h < 285) return '紫';
    return 'マゼンタ';
  }

  private generateColorVariation(baseColor: RGB, variation: number): RGB {
    const factor = variation * 0.2;
    return {
      r: Math.max(0, Math.min(255, Math.round(baseColor.r + (Math.random() - 0.5) * 100 * factor))),
      g: Math.max(0, Math.min(255, Math.round(baseColor.g + (Math.random() - 0.5) * 100 * factor))),
      b: Math.max(0, Math.min(255, Math.round(baseColor.b + (Math.random() - 0.5) * 100 * factor))),
    };
  }

  private getComplementaryColors(dominantColor: ColorAnalysis): ColorAnalysis[] {
    const { h } = dominantColor.hsv;
    const complementaryH = (h + 180) % 360;
    
    const complementaryRgb = this.hsvToRgb({ h: complementaryH, s: dominantColor.hsv.s, v: dominantColor.hsv.v });
    
    return [{
      rgb: complementaryRgb,
      hsv: { h: complementaryH, s: dominantColor.hsv.s, v: dominantColor.hsv.v },
      hex: this.rgbToHex(complementaryRgb),
      colorName: this.getColorName(complementaryRgb),
      frequency: 0.1,
    }];
  }

  private hsvToRgb(hsv: HSV): RGB {
    const h = hsv.h / 60;
    const s = hsv.s / 100;
    const v = hsv.v / 100;

    const c = v * s;
    const x = c * (1 - Math.abs((h % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 1) { r = c; g = x; b = 0; }
    else if (h >= 1 && h < 2) { r = x; g = c; b = 0; }
    else if (h >= 2 && h < 3) { r = 0; g = c; b = x; }
    else if (h >= 3 && h < 4) { r = 0; g = x; b = c; }
    else if (h >= 4 && h < 5) { r = x; g = 0; b = c; }
    else if (h >= 5 && h < 6) { r = c; g = 0; b = x; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  private determineTemperature(colors: ColorAnalysis[]): 'warm' | 'cool' | 'neutral' {
    let warmCount = 0;
    let coolCount = 0;

    for (const color of colors) {
      const { h } = color.hsv;
      if ((h >= 0 && h <= 60) || (h >= 300 && h <= 360)) {
        warmCount += color.frequency;
      } else if (h >= 120 && h <= 240) {
        coolCount += color.frequency;
      }
    }

    if (warmCount > coolCount * 1.5) return 'warm';
    if (coolCount > warmCount * 1.5) return 'cool';
    return 'neutral';
  }

  private calculateComplexity(colors: ColorAnalysis[]): number {
    // 色の数とばらつきから複雑度を計算
    const colorCount = colors.length;
    const saturationVariance = this.calculateSaturationVariance(colors);
    
    return Math.min(10, Math.round(colorCount * 0.8 + saturationVariance * 0.2 * 10));
  }

  private calculateSaturationVariance(colors: ColorAnalysis[]): number {
    const saturations = colors.map(c => c.hsv.s);
    const mean = saturations.reduce((sum, s) => sum + s, 0) / saturations.length;
    const variance = saturations.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / saturations.length;
    
    return Math.sqrt(variance) / 100; // 0-1の範囲に正規化
  }

  private calculateBasicColorMixture(rgb: RGB): Array<{ name: string; ratio: number; hex: string }> {
    // 簡易的な基本色への分解
    const basicColors = [
      { name: '赤', color: { r: 255, g: 0, b: 0 } },
      { name: '青', color: { r: 0, g: 0, b: 255 } },
      { name: '黄', color: { r: 255, g: 255, b: 0 } },
      { name: '白', color: { r: 255, g: 255, b: 255 } },
      { name: '黒', color: { r: 0, g: 0, b: 0 } },
    ];

    const mixtures = basicColors.map(basic => {
      const similarity = 1 - (this.colorDistance(rgb, basic.color) / Math.sqrt(3 * 255 * 255));
      return {
        name: basic.name,
        ratio: Math.max(0, Math.round(similarity * 100)),
        hex: this.rgbToHex(basic.color),
      };
    });

    // 比率を正規化
    const totalRatio = mixtures.reduce((sum, m) => sum + m.ratio, 0);
    if (totalRatio > 0) {
      mixtures.forEach(m => {
        m.ratio = Math.round((m.ratio / totalRatio) * 100);
      });
    }

    return mixtures.filter(m => m.ratio > 5).slice(0, 4);
  }

  private generateMixingSteps(basicColors: Array<{ name: string; ratio: number; hex: string }>, material: Material): string[] {
    const dominantColors = basicColors.filter(c => c.ratio >= 20);
    const steps: string[] = [];

    if (dominantColors.length === 1) {
      steps.push(`${dominantColors[0].name}をベースとして使用`);
    } else if (dominantColors.length >= 2) {
      steps.push(`まず${dominantColors[0].name}（${dominantColors[0].ratio}%）と${dominantColors[1].name}（${dominantColors[1].ratio}%）を混合`);
      
      if (dominantColors.length > 2) {
        steps.push(`少しずつ${dominantColors[2].name}を加えて調整`);
      }
    }

    // 画材別の補足
    switch (material) {
      case 'watercolor':
        steps.push('少量の水で薄めながら透明感を調整');
        break;
      case 'acrylic':
        steps.push('よく混ぜて均一な色味を作る');
        break;
      case 'colored-pencil':
        steps.push('薄い色から重ね塗りで濃度を調整');
        break;
      case 'pencil':
        steps.push('筆圧で濃淡を調整');
        break;
    }

    return steps;
  }

  private getMaterialSpecificTechniques(color: ColorAnalysis, material: Material) {
    const techniques = {
      watercolor: {
        technique: '透明水彩での混色',
        tips: [
          '水を多めに使って透明感を保つ',
          '紙が乾く前に色を重ねてにじみ効果を活用',
          '明るい色から暗い色へ順番に重ねる',
        ],
        warnings: ['一度濃くすると薄くできないので注意'],
      },
      acrylic: {
        technique: 'アクリル絵の具での混色',
        tips: [
          'パレット上で十分に混ぜ合わせる',
          '乾燥が早いので手早く作業',
          '白を加えて明度を調整',
        ],
        warnings: ['乾燥後は色が少し濃くなることがある'],
      },
      'colored-pencil': {
        technique: '色鉛筆での色作り',
        tips: [
          '薄い圧力で重ね塗りして色を作る',
          '円を描くように塗って均一に',
          '異なる色を重ねて新しい色を作る',
        ],
        warnings: ['濃く塗りすぎると修正が困難'],
      },
      pencil: {
        technique: '鉛筆での階調表現',
        tips: [
          '筆圧でグラデーションを作る',
          'ティッシュでぼかして柔らかい印象に',
          '消しゴムでハイライトを作る',
        ],
      },
    };

    return techniques[material];
  }
}

export const colorPaletteService = new ColorPaletteService();