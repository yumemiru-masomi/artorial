import { GoogleGenerativeAI } from "@google/generative-ai";

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
   * Gemini 2.5 Flash Image Previewで実際の画像生成を行う
   */
  private async callGeminiAPI(
    base64Image: string,
    prompt: string
  ): Promise<Buffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      console.log("🚀 Gemini 2.5 Flash Image Previewで画像生成を開始...");
      console.log("- Model:", "gemini-2.5-flash-image-preview");
      console.log("- Prompt length:", prompt.length);

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

      // デバッグ用: レスポンス詳細をログ出力
      console.log("Gemini API Response:");
      console.log("- Candidates count:", response.candidates?.length || 0);
      console.log(
        "- First candidate parts:",
        response.candidates?.[0]?.content?.parts?.length || 0
      );

      // レスポンスから生成された画像を抽出
      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content) {
        const parts = candidates[0].content.parts;
        if (parts && parts.length > 0) {
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            console.log(`- Part ${i}:`, {
              hasInlineData: !!part.inlineData,
              mimeType: part.inlineData?.mimeType,
              hasText: !!part.text,
              textLength: part.text?.length || 0,
            });

            // 生成された画像データを取得
            if (
              part.inlineData &&
              part.inlineData.mimeType?.startsWith("image/")
            ) {
              console.log("✅ 生成された画像データを発見！");
              return Buffer.from(part.inlineData.data, "base64");
            }
          }
        }
      }

      // 画像が生成されなかった場合のフォールバック
      console.warn("Geminiで画像が生成されませんでした。元画像を返します。");
      return Buffer.from(base64Image, "base64");
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        console.error("⏰ Gemini APIタイムアウト（30秒超過）");
        throw new Error("TIMEOUT");
      }

      console.error("❌ Gemini画像生成エラー:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        stack:
          error instanceof Error
            ? error.stack?.split("\n").slice(0, 3)
            : undefined,
      });

      // エラー時は元画像を返す
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

    const base64Image = imageBuffer.toString("base64");

    // 複数の画像が必要なステップ（平塗り、ハイライト、影）の場合
    if (
      previousStepImageUrl &&
      (prompt.includes("line art") || prompt.includes("flat color"))
    ) {
      // TODO: Gemini API用のマルチ画像入力を実装
      // 現在は単一画像アプローチを使用
      console.log(`🔄 Multi-image input detected for step generation`);
    }

    // 元画像を主要な参照として使用
    return this.callGeminiAPI(base64Image, prompt);
  }
}

export const geminiImageService = new GeminiImageService();
