import { GoogleGenerativeAI } from "@google/generative-ai";
import { Material } from "@/types/tutorial";
import { GeneratedImages } from "@/types/image-generation";

export class GeminiImageService {
  private genAI: GoogleGenerativeAI;
  private model: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.IMAGE_MODEL_ID ?? "gemini-2.5-flash-image-preview", // 画像生成専用モデル
    });
  }

  /**
   * Generate all 4 variations of the image in parallel
   */
  async generateAllVariations(
    imageBuffer: Buffer,
    material: Material,
    textureStrength: number = 40
  ): Promise<GeneratedImages> {
    const base64Image = imageBuffer.toString("base64");

    try {
      const [lineArt, flatColor, highlight, paintedSample] =
        await Promise.allSettled([
          this.generateLineArt(base64Image),
          this.generateFlatColor(base64Image, material, textureStrength),
          this.generateHighlight(base64Image, material, textureStrength),
          this.generatePaintedSample(base64Image, material, textureStrength),
        ]);

      return {
        lineArt: lineArt.status === "fulfilled" ? lineArt.value : imageBuffer,
        flatColor:
          flatColor.status === "fulfilled" ? flatColor.value : imageBuffer,
        highlight:
          highlight.status === "fulfilled" ? highlight.value : imageBuffer,
        paintedSample:
          paintedSample.status === "fulfilled"
            ? paintedSample.value
            : imageBuffer,
      };
    } catch (error) {
      console.error("Error generating image variations:", error);
      // Fallback to original image for all variations
      return {
        lineArt: imageBuffer,
        flatColor: imageBuffer,
        highlight: imageBuffer,
        paintedSample: imageBuffer,
      };
    }
  }

  /**
   * Generate line art - white background with black lines only
   */
  private async generateLineArt(base64Image: string): Promise<Buffer> {
    const prompt = `Convert this image to clean line art:
- Extract only the main outlines and contours
- Create black lines on white background
- Remove all colors, gradients, and shading
- Maintain the character's shape and pose
- Use clean, bold line weights
- Anime/manga style line art
- High contrast black and white only

Generate a line art version of this image.`;

    return this.callGeminiAPI(base64Image, prompt);
  }

  /**
   * Generate flat color version with basic material texture
   */
  private async generateFlatColor(
    base64Image: string,
    material: Material,
    textureStrength: number
  ): Promise<Buffer> {
    const materialTextures = {
      watercolor: `watercolor texture with soft paper grain`,
      acrylic: `thick acrylic paint texture with brush strokes`,
      "colored-pencil": `colored pencil texture with paper grain and light hatching`,
      pencil: `pencil shading with graphite gradations`,
    };

    const prompt = `Convert this image to flat color style with ${material} medium:
- Apply flat, solid colors without gradients
- Add ${materialTextures[material] || "smooth texture"}
- Maintain the character's shape and pose
- Use cel-shading anime style
- Add thin black outlines around shapes
- Apply ${material} artistic medium characteristics

Generate a flat color version of this image.`;

    return this.callGeminiAPI(base64Image, prompt);
  }

  /**
   * Generate highlight layer - transparent PNG with white highlights only
   */
  private async generateHighlight(
    base64Image: string,
    material: Material,
    textureStrength: number
  ): Promise<Buffer> {
    const materialHighlights = {
      watercolor: `抜き（リフト）やにじみ境界を控えめに。`,
      acrylic: `厚塗りの艶ハイライト（微細な筆跡反射）を控えめに。`,
      "colored-pencil": `白鉛筆の点描・紙目に沿うタッチを控えめに。`,
      pencil: `紙の白い部分と光の反射による自然なハイライト。`,
    };

    const prompt = `Extract highlight effects from this image with ${material} medium:
- Create white highlights only on transparent background
- Extract the brightest areas and light reflections
- Apply ${materialHighlights[material] || "smooth highlights"}
- Maintain the character's shape and pose
- Output as transparent PNG format
- Soft, natural highlight placement

Generate a highlight layer from this image.`;

    return this.callGeminiAPI(base64Image, prompt);
  }

  /**
   * Generate painted sample with strong material texture
   */
  private async generatePaintedSample(
    base64Image: string,
    material: Material,
    textureStrength: number
  ): Promise<Buffer> {
    const materialStyles = {
      watercolor: `透明感、重ね（グレーズ）、にじみ、紙目。`,
      acrylic: `厚塗り、筆致、やや強い発色、わずかな光沢。`,
      "colored-pencil": `重ね塗り、ハッチング、紙粒子、柔らかいエッジ。`,
      pencil: `鉛筆特有の質感、グラデーション、紙の粒子感、濃淡の変化。`,
    };

    const prompt = `Transform this image into a finished painting with ${material} medium:
- Apply rich ${materialStyles[material]}
- Enhance with professional artwork quality
- Add detailed material-specific textures
- Maintain the character's shape and pose
- Use full color range appropriate for ${material}
- Create museum-quality finished appearance

Generate a finished painting version of this image.`;

    return this.callGeminiAPI(base64Image, prompt);
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
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts;
        if (parts) {
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
   * Generate step-specific image based on custom prompt
   * Supports multiple input images for layered generation
   */
  async generateStepImage(
    imageBuffer: Buffer,
    prompt: string,
    previousStepImageUrl?: string
  ): Promise<Buffer> {
    const base64Image = imageBuffer.toString("base64");

    // For steps that require multiple images (flat color, highlights, shadows)
    if (
      previousStepImageUrl &&
      (prompt.includes("line art") || prompt.includes("flat color"))
    ) {
      // TODO: Implement multi-image input for Gemini API
      // For now, use single image approach
      console.log(`🔄 Multi-image input detected for step generation`);
    }

    // Use the original image as primary reference
    return this.callGeminiAPI(base64Image, prompt);
  }
}

export const geminiImageService = new GeminiImageService();
