import sharp from "sharp";
import { AnimeStyleProcessor } from "./anime-processor";

export class ImageProcessor {
  private animeProcessor: AnimeStyleProcessor;

  constructor() {
    this.animeProcessor = new AnimeStyleProcessor();
  }

  /**
   * 画像を輪郭線のみの線画に変換（下書き段階用）
   */
  async createLineArt(inputBuffer: Buffer): Promise<Buffer> {
    try {
      // エッジ検出とコントラスト調整を組み合わせて線画風に変換
      const processed = await sharp(inputBuffer)
        .grayscale()
        .normalize()
        .threshold(128) // 二値化
        .negate() // 色を反転
        .resize(800, 600, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      return processed;
    } catch (error) {
      console.error("Line art creation error:", error);
      throw new Error("線画の生成に失敗しました");
    }
  }

  /**
   * 画像をグレースケールの陰影表現に変換（陰影段階用）
   */
  async createShadingGuide(inputBuffer: Buffer): Promise<Buffer> {
    try {
      const processed = await sharp(inputBuffer)
        .grayscale()
        .gamma(1.2) // コントラストを少し上げる
        .modulate({
          brightness: 0.9,
          saturation: 0,
          hue: 0,
        })
        .resize(800, 600, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      return processed;
    } catch (error) {
      console.error("Shading guide creation error:", error);
      throw new Error("陰影ガイドの生成に失敗しました");
    }
  }

  /**
   * 画像を基本色での色彩ガイドに変換（彩色段階用）
   */
  async createColorGuide(
    inputBuffer: Buffer,
    saturationLevel: number = 0.7
  ): Promise<Buffer> {
    try {
      const processed = await sharp(inputBuffer)
        .modulate({
          brightness: 1.1,
          saturation: saturationLevel,
          hue: 0,
        })
        .blur(2) // わずかにブラー
        .resize(800, 600, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      return processed;
    } catch (error) {
      console.error("Color guide creation error:", error);
      throw new Error("色彩ガイドの生成に失敗しました");
    }
  }

  /**
   * 画材に応じた参考画像を段階別に生成
   */
  async generateReferenceImages(
    inputBuffer: Buffer,
    material: string,
    stepNumber: number,
    totalSteps: number
  ): Promise<Buffer> {
    try {
      const progressRatio = stepNumber / totalSteps;

      switch (material) {
        case "pencil": // デッサン
          if (stepNumber === 1) {
            // 下書き段階: 線画
            return this.createLineArt(inputBuffer);
          } else if (stepNumber <= Math.ceil(totalSteps * 0.6)) {
            // 輪郭・基本陰影段階: グレースケール
            return this.createShadingGuide(inputBuffer);
          } else {
            // 詳細陰影・仕上げ段階: より詳細なグレースケール
            return sharp(inputBuffer)
              .grayscale()
              .gamma(0.9)
              .resize(800, 600, { fit: "inside", withoutEnlargement: true })
              .jpeg({ quality: 90 })
              .toBuffer();
          }

        case "watercolor": // 水彩画
          if (stepNumber === 1) {
            // 下書き段階: 薄い線画
            return this.createLineArt(inputBuffer);
          } else if (stepNumber === 2) {
            // 薄塗り段階: 非常に薄い色
            return this.createColorGuide(inputBuffer, 0.3);
          } else if (stepNumber <= Math.ceil(totalSteps * 0.7)) {
            // 中間色段階: 中程度の彩度
            return this.createColorGuide(inputBuffer, 0.6);
          } else {
            // 濃い色・仕上げ段階: 通常の彩度
            return this.createColorGuide(inputBuffer, 0.9);
          }

        case "colored-pencil": // 色鉛筆
          if (stepNumber === 1) {
            // 下書き段階: 線画
            return this.createLineArt(inputBuffer);
          } else if (stepNumber <= Math.ceil(totalSteps * 0.4)) {
            // 基本色塗り段階: 薄めの色
            return this.createColorGuide(inputBuffer, 0.5);
          } else if (stepNumber <= Math.ceil(totalSteps * 0.8)) {
            // 色の重ね段階: 中程度の色
            return this.createColorGuide(inputBuffer, 0.8);
          } else {
            // 細部描写・仕上げ段階: 濃い色
            return this.createColorGuide(inputBuffer, 1.0);
          }

        case "acrylic": // アクリル絵の具（アニメ調処理）
          if (stepNumber === 1) {
            // ステップ1: 高品質線画
            return this.animeProcessor.createCleanLineArt(inputBuffer);
          } else if (stepNumber === 2) {
            // ステップ2: ベタ塗り
            return this.animeProcessor.createFlatColors(inputBuffer);
          } else {
            // ステップ3以降: ハイライト・陰影
            return this.animeProcessor.createHighlights(inputBuffer);
          }

        default:
          // デフォルト: 元画像をリサイズのみ
          return sharp(inputBuffer)
            .resize(800, 600, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();
      }
    } catch (error) {
      console.error("Reference image generation error:", error);
      throw new Error("参考画像の生成に失敗しました");
    }
  }

  /**
   * 画像のメタデータを除去（セキュリティ対策）
   */
  async removeMetadata(inputBuffer: Buffer): Promise<Buffer> {
    try {
      return sharp(inputBuffer)
        .rotate() // EXIF回転情報に基づいて回転（その後除去）
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch (error) {
      console.error("Metadata removal error:", error);
      throw new Error("画像処理に失敗しました");
    }
  }

  /**
   * 画像を指定サイズに圧縮
   */
  async compressImage(
    inputBuffer: Buffer,
    maxSizeKB: number = 500
  ): Promise<Buffer> {
    try {
      let quality = 90;
      let compressed = await sharp(inputBuffer).jpeg({ quality }).toBuffer();

      // サイズが大きすぎる場合は品質を下げて再圧縮
      while (compressed.length > maxSizeKB * 1024 && quality > 20) {
        quality -= 10;
        compressed = await sharp(inputBuffer).jpeg({ quality }).toBuffer();
      }

      return compressed;
    } catch (error) {
      console.error("Image compression error:", error);
      throw new Error("画像の圧縮に失敗しました");
    }
  }
}
