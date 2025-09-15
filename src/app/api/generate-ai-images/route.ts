import { NextRequest, NextResponse } from "next/server";
import { ImageProcessor } from "@/lib/image-processor";
import { ApiResponse } from "@/types/api";
import { Material } from "@/types/tutorial";
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "@/types/image-generation";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ImageGenerationRequest = await request.json();
    const { imageUrl, material, textureStrength = 40 } = body;

    // バリデーション
    if (!imageUrl || typeof imageUrl !== "string") {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "画像URLが指定されていません。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!material || typeof material !== "string") {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "画材が指定されていません。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const validMaterials: Material[] = [
      // TODO: 今後追加予定の画材
      // 'pencil', 'watercolor', 'colored-pencil',
      "acrylic",
    ];
    if (!validMaterials.includes(material as Material)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "無効な画材が指定されました。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (
      typeof textureStrength !== "number" ||
      textureStrength < 0 ||
      textureStrength > 100
    ) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "質感の強さは0〜100の数値で指定してください。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 元画像の読み込み
    let inputBuffer: Buffer;
    try {
      if (imageUrl.startsWith("/uploads/")) {
        // ローカルファイルの場合
        const filePath = path.join(process.cwd(), "public", imageUrl);
        inputBuffer = await readFile(filePath);
      } else {
        // 外部URLの場合
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        inputBuffer = Buffer.from(arrayBuffer);
      }
    } catch (error) {
      console.error("Image loading error:", error);
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "GENERATION_ERROR",
          message: "元画像の読み込みに失敗しました。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 画像生成保存用ディレクトリの作成
    const generatedDir = path.join(process.cwd(), "public", "generated");
    if (!existsSync(generatedDir)) {
      await mkdir(generatedDir, { recursive: true });
    }

    let generatedImages: ImageGenerationResponse["images"];

    try {
      // 環境変数チェック
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
      }

      // Gemini 2.5 Flash Image による画像生成を試行
      const { GeminiImageService } = await import("@/services/gemini-image");
      const geminiImageService = new GeminiImageService();
      const aiGeneratedImages = await geminiImageService.generateAllVariations(
        inputBuffer,
        material as Material,
        textureStrength
      );

      const timestamp = Date.now();
      const imageUrls: ImageGenerationResponse["images"] = {
        lineArt: "",
        flatColor: "",
        highlight: "",
        paintedSample: "",
      };

      // 各生成画像を保存
      for (const [type, buffer] of Object.entries(aiGeneratedImages)) {
        const fileName = `ai-${timestamp}-${type}.jpg`;
        const filePath = path.join(generatedDir, fileName);

        try {
          await writeFile(filePath, buffer);
          imageUrls[type as keyof typeof imageUrls] = `/generated/${fileName}`;
        } catch (saveError) {
          console.error(`Failed to save ${type} image:`, saveError);
          // フォールバック: 元画像を使用
          imageUrls[type as keyof typeof imageUrls] = imageUrl;
        }
      }

      generatedImages = imageUrls;
    } catch (geminiError) {
      console.warn(
        "Gemini image generation failed, falling back to ImageProcessor:",
        geminiError
      );

      // フォールバック: 既存のImageProcessorを使用
      try {
        const imageProcessor = new ImageProcessor();
        const timestamp = Date.now();
        const imageUrls: ImageGenerationResponse["images"] = {
          lineArt: imageUrl,
          flatColor: imageUrl,
          highlight: imageUrl,
          paintedSample: imageUrl,
        };

        // 基本的な処理のみ実行（簡略化されたフォールバック）
        const processedBuffer = await imageProcessor.generateReferenceImages(
          inputBuffer,
          material,
          1,
          1
        );

        const fileName = `fallback-${timestamp}.jpg`;
        const filePath = path.join(generatedDir, fileName);
        await writeFile(filePath, processedBuffer);

        // 全ての画像タイプに同じ処理済み画像を使用（フォールバック時）
        const fallbackUrl = `/generated/${fileName}`;
        imageUrls.lineArt = fallbackUrl;
        imageUrls.flatColor = fallbackUrl;
        imageUrls.highlight = fallbackUrl;
        imageUrls.paintedSample = fallbackUrl;

        generatedImages = imageUrls;
      } catch (fallbackError) {
        console.error("Fallback image processing also failed:", fallbackError);

        // 最終フォールバック: 元画像を全てに使用
        generatedImages = {
          lineArt: imageUrl,
          flatColor: imageUrl,
          highlight: imageUrl,
          paintedSample: imageUrl,
        };
      }
    }

    const response: ApiResponse<ImageGenerationResponse> = {
      success: true,
      data: {
        images: generatedImages,
        material: material as Material,
        textureStrength,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Generate AI images API error:", error);

    let errorMessage = "AI画像生成に失敗しました。";
    let errorCode = "GENERATION_ERROR";

    if (error instanceof Error) {
      if (error.message.includes("TIMEOUT")) {
        errorMessage =
          "画像生成がタイムアウトしました。画像サイズを小さくしてお試しください。";
        errorCode = "TIMEOUT_ERROR";
      } else if (
        error.message.includes("ENOENT") ||
        error.message.includes("file")
      ) {
        errorMessage = "画像ファイルが見つかりません。";
      } else if (
        error.message.includes("memory") ||
        error.message.includes("size")
      ) {
        errorMessage = "画像サイズが大きすぎます。小さい画像をお試しください。";
      } else if (error.message.includes("API")) {
        errorMessage =
          "AI画像生成サービスに問題が発生しました。しばらく待ってから再試行してください。";
      }
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
