import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/services/gemini";
import { ApiResponse } from "@/types/api";
import {
  StepGenerationResponse,
  ImageAnalysisResponse,
} from "@/types/analysis";
import { Material } from "@/types/tutorial";

const VALID_MATERIALS: Material[] = [
  // TODO: 今後追加予定の画材
  // 'pencil', 'watercolor', 'colored-pencil',
  "acrylic",
];
const GENERATION_TIMEOUT = 45000; // 45秒

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { imageUrl, material, analysisResult } = body;

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

    if (!material || !VALID_MATERIALS.includes(material)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "有効な画材が選択されていません。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!analysisResult || typeof analysisResult !== "object") {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "解析結果が提供されていません。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Gemini APIキーの確認
    if (!process.env.GEMINI_API_KEY) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "GENERATION_ERROR",
          message: "AI手順生成サービスが設定されていません。",
        },
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const geminiService = new GeminiService();

    // タイムアウト付きで手順生成実行
    const generationPromise = geminiService.generateSteps(
      imageUrl,
      material,
      analysisResult as ImageAnalysisResponse
    );
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("TIMEOUT"));
      }, GENERATION_TIMEOUT);
    });

    try {
      const stepsResult = await Promise.race([
        generationPromise,
        timeoutPromise,
      ]);

      // 手順生成結果の検証
      if (
        !stepsResult.steps ||
        !Array.isArray(stepsResult.steps) ||
        stepsResult.steps.length === 0
      ) {
        throw new Error("Invalid steps result");
      }

      // 各ステップの検証
      const validatedSteps = stepsResult.steps.map((step, index) => ({
        stepNumber: step.stepNumber || index + 1,
        title: step.title || `ステップ ${index + 1}`,
        description: step.description || "",
        tips: Array.isArray(step.tips) ? step.tips : [],
        estimatedDuration: Math.max(5, step.estimatedDuration || 30), // 最低5分
        techniques: Array.isArray(step.techniques) ? step.techniques : [],
      }));

      const totalTime = validatedSteps.reduce(
        (sum, step) => sum + step.estimatedDuration,
        0
      );

      const response: ApiResponse<StepGenerationResponse> = {
        success: true,
        data: {
          steps: validatedSteps,
          totalEstimatedTime: Math.max(totalTime, 30), // 最低30分
        },
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "TIMEOUT") {
        const errorResponse: ApiResponse<null> = {
          success: false,
          error: {
            code: "TIMEOUT_ERROR",
            message:
              "手順生成に時間がかかりすぎています。しばらく待ってから再試行してください。",
          },
        };
        return NextResponse.json(errorResponse, { status: 408 });
      }

      throw error; // 他のエラーは外側のcatchブロックで処理
    }
  } catch (error) {
    console.error("Step generation API error:", error);

    let errorMessage =
      "手順の生成に失敗しました。しばらく待ってから再試行してください。";
    let errorCode = "GENERATION_ERROR";

    if (error instanceof Error) {
      if (
        error.message.includes("API key") ||
        error.message.includes("quota")
      ) {
        errorMessage =
          "AI手順生成サービスでエラーが発生しました。しばらく待ってから再試行してください。";
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        errorMessage = "ネットワーク接続を確認してください。";
        errorCode = "NETWORK_ERROR";
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
