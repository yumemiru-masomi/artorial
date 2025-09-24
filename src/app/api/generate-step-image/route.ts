import { NextRequest, NextResponse } from "next/server";
import { Material } from "@/types/tutorial";
import { ApiResponse } from "@/types/api";
import { ImageCategory } from "@/types/analysis";
import { generateLineArtPrompt } from "@/services/prompts/common-lineart";
import {
  generateCharacterPrompt,
  generateCharacterPromptByType,
} from "@/services/prompts/character-prompts";
import {
  generateLandscapePrompt,
  generateLandscapePromptByType,
} from "@/services/prompts/landscape-prompts";
import {
  generateStillLifePrompt,
  generateStillLifePromptByType,
} from "@/services/prompts/stilllife-prompts";
import {
  generateAbstractPrompt,
  generateAbstractPromptByType,
} from "@/services/prompts/abstract-prompts";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      originalImageUrl,
      stepNumber,
      stepDescription,
      stepType,
      material,
      category,
    }: {
      originalImageUrl: string;
      stepNumber: number;
      stepDescription: string;
      stepType?: string;
      material: Material;
      category?: ImageCategory;
    } = body;

    // バリデーション
    if (!originalImageUrl || !stepNumber || !stepDescription || !material) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "必要なパラメータが不足しています。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 元画像を読み込み
    let inputBuffer: Buffer;
    try {
      if (originalImageUrl.startsWith("/uploads/")) {
        // ローカルファイルの場合
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "public", originalImageUrl);
        inputBuffer = await fs.readFile(filePath);
      } else {
        // 外部URLの場合
        const response = await fetch(originalImageUrl);
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
          code: "IMAGE_LOAD_ERROR",
          message: "画像の読み込みに失敗しました。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 環境変数チェック
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Gemini Image Serviceで画像生成
    const { geminiImageService } = await import("@/services/gemini-image");

    // カテゴリ別プロンプト生成
    const prompt = generateCategoryPrompt(
      stepNumber,
      stepDescription,
      category || "other",
      stepType
    );

    const generatedImageBuffer = await geminiImageService.generateStepImage(
      inputBuffer,
      prompt
    );

    // 生成された画像をBase64で返す
    const base64Image = `data:image/png;base64,${generatedImageBuffer.toString(
      "base64"
    )}`;

    const response: ApiResponse<{ imageUrl: string }> = {
      success: true,
      data: {
        imageUrl: base64Image,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Generate step image API error:", error);

    let errorMessage = "ステップ画像の生成に失敗しました。";
    let errorCode = "GENERATION_ERROR";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message === "TIMEOUT") {
        errorMessage =
          "画像生成に時間がかかりすぎています。しばらく待ってから再試行してください。";
        errorCode = "TIMEOUT_ERROR";
        statusCode = 408;
      } else if (error.message.includes("GEMINI_API_KEY")) {
        errorMessage = "AI画像生成サービスが設定されていません。";
        errorCode = "SERVICE_ERROR";
      } else if (
        error.message.includes("quota") ||
        error.message.includes("limit")
      ) {
        errorMessage =
          "AI画像生成サービスの利用制限に達しました。しばらく待ってから再試行してください。";
        errorCode = "QUOTA_ERROR";
        statusCode = 429;
      }
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * カテゴリ別プロンプト生成関数
 *
 * Geminiラベル → プロンプトカテゴリのマッピング:
 * - landscape: "風景画" → 風景画プロンプト
 * - portrait: "人物画" → キャラクタープロンプト
 * - character: "キャラクター画" → キャラクタープロンプト
 * - animal: "動物画" → キャラクタープロンプト
 * - still_life: "静物画" → 静物プロンプト
 * - architecture: "建築物" → 静物プロンプト
 * - abstract: "抽象画" → その他プロンプト
 * - other: "その他" → その他プロンプト
 */
function generateCategoryPrompt(
  stepNumber: number,
  stepDescription: string,
  category: ImageCategory,
  stepType?: string
): string {
  // ステップタイプが指定されている場合は、それを優先
  if (stepType) {
    // 線画は全カテゴリ共通
    if (stepType === "lineart") {
      return generateLineArtPrompt();
    }

    // カテゴリ別のstepType処理
    switch (category) {
      case "portrait":
      case "character":
      case "animal":
        return generateCharacterPromptByType(stepType, stepDescription);

      case "landscape":
        return generateLandscapePromptByType(stepType, stepDescription);

      case "still_life":
      case "architecture":
        return generateStillLifePromptByType(stepType, stepDescription);

      default:
        return generateAbstractPromptByType(stepType, stepDescription);
    }
  }

  // フォールバック: 従来の文字列マッチング

  // ステップ1: 線画（全カテゴリ共通）
  if (
    stepNumber === 1 ||
    stepDescription.includes("線画") ||
    stepDescription.includes("下書き") ||
    stepDescription.includes("輪郭") ||
    stepDescription.includes("スケッチ") ||
    stepDescription.includes("構図") ||
    stepDescription.toLowerCase().includes("sketch") ||
    stepDescription.toLowerCase().includes("outline")
  ) {
    return generateLineArtPrompt();
  }

  // ステップ2以降: カテゴリ別分岐
  switch (category) {
    case "landscape":
      return generateLandscapePrompt(stepDescription);

    case "portrait":
    case "character":
    case "animal":
      return generateCharacterPrompt(stepDescription);

    case "still_life":
    case "architecture":
      return generateStillLifePrompt(stepDescription);

    default:
      return generateAbstractPrompt(stepDescription);
  }
}
