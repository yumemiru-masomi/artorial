import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

interface GenerativeModel {
  generateContent(
    parts: Array<{ inlineData: { mimeType: string; data: string } } | string>
  ): Promise<{
    response: {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { mimeType?: string; data: string };
            text?: string;
          }>;
        };
      }>;
    };
  }>;
}

export class GeminiImageService {
  private genAI?: GoogleGenerativeAI;
  private model?: GenerativeModel;
  private isInitialized = false;

  constructor() {
    // 遅延初期化パターンを採用
    this.initializeIfNeeded();
  }

  private initializeIfNeeded(): void {
    if (this.isInitialized) return;

    // ビルド時は環境変数チェックをスキップ
    if (process.env.NODE_ENV === "production" && !process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // 環境変数が存在する場合のみ初期化
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({
        model: process.env.IMAGE_MODEL_ID ?? "gemini-2.5-flash-image-preview", // 画像生成専用モデル
      });
      this.isInitialized = true;
    }
  }

  /**
   * 画像を最適化してファイルサイズを削減
   */
  private async optimizeImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const optimized = await sharp(imageBuffer)
        .resize(1024, 1024, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      return optimized;
    } catch (error) {
      return imageBuffer;
    }
  }

  /**
   * Sharp.jsを使用したフォールバック線画生成
   */
  private async generateLineArtFallback(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const lineArt = await sharp(imageBuffer)
        .resize(800, 600, { fit: "inside", withoutEnlargement: true })
        .grayscale()
        .normalize()
        // エッジ検出のためのコントラスト強化
        .linear(2.0, -(128 * 1.0))
        .threshold(140) // 二値化
        .negate() // 白背景、黒線に反転
        .png() // PNG形式で出力
        .toBuffer();

      return lineArt;
    } catch (error) {
      console.error("❌ Sharp.js線画生成エラー:", error);
      throw new Error("フォールバック線画生成に失敗しました");
    }
  }

  /**
   * Gemini 2.5 Flash Image Previewで実際の画像生成を行う
   */
  private async callGeminiAPI(
    base64Image: string,
    prompt: string
  ): Promise<Buffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒に延長

    try {
      // Gemini 2.5 Flash Image Previewで画像生成を実行
      if (!this.model) {
        throw new Error("Model is not initialized");
      }

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        prompt,
      ]);

      clearTimeout(timeoutId);

      const response = result.response;

      // レスポンスから生成された画像を抽出
      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content) {
        const parts = candidates[0].content.parts;
        if (parts && parts.length > 0) {
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            // 生成された画像データを取得
            if (
              part.inlineData &&
              part.inlineData.mimeType?.startsWith("image/")
            ) {
              return Buffer.from(part.inlineData.data, "base64");
            }
          }
        }
      }

      // 画像が生成されなかった場合のフォールバック
      return Buffer.from(base64Image, "base64");
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("TIMEOUT");
      }

      // APIエラーの種類に応じた処理
      if (error instanceof Error) {
        if (
          error.message.includes("quota") ||
          error.message.includes("limit")
        ) {
          throw new Error("QUOTA_EXCEEDED");
        } else if (
          error.message.includes("invalid") ||
          error.message.includes("format")
        ) {
          throw new Error("INVALID_FORMAT");
        }
      }

      // その他のエラー時は元画像を返す
      console.warn("🔄 エラーのため元画像にフォールバック");
      return Buffer.from(base64Image, "base64");
    }
  }

  /**
   * カスタムプロンプトに基づいてステップ固有の画像を生成
   * レイヤー生成のための複数入力画像をサポート
   */
  async generateStepImage(
    imageBuffer: Buffer,
    prompt: string,
    previousStepImageUrl?: string
  ): Promise<Buffer> {
    this.initializeIfNeeded();
    if (!this.genAI || !this.model) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // 画像を最適化してからAPI呼び出し
    const optimizedBuffer = await this.optimizeImage(imageBuffer);
    const base64Image = optimizedBuffer.toString("base64");

    // 複数の画像が必要なステップ（平塗り、ハイライト、影）の場合
    if (
      previousStepImageUrl &&
      (prompt.includes("line art") || prompt.includes("flat color"))
    ) {
      // TODO: Gemini API用のマルチ画像入力を実装
      // 現在は単一画像アプローチを使用
      console.log(`🔄 Multi-image input detected for step generation`);
    }

    // 線画生成の場合はフォールバック処理を追加
    if (prompt.includes("線画") || prompt.includes("白黒の線画")) {
      try {
        console.log("🎯 線画生成: Gemini APIを試行");
        return await this.callGeminiAPI(base64Image, prompt);
      } catch (error) {
        console.warn(
          "⚠️ Gemini線画生成失敗、Sharp.jsフォールバックを使用:",
          error
        );
        return await this.generateLineArtFallback(optimizedBuffer);
      }
    }

    // その他のステップは通常通りGemini APIを使用
    return this.callGeminiAPI(base64Image, prompt);
  }
}

export const geminiImageService = new GeminiImageService();
