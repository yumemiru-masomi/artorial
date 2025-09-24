import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types/api";
import { StepGenerationResponse } from "@/types/analysis";
import { Material } from "@/types/tutorial";
import { dynamicStepGenerator } from "@/services/dynamic-step-generator";

const VALID_MATERIALS: Material[] = ["acrylic"]; //あとで消す

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const material = formData.get("material") as string;
    const analysisResultStr = formData.get("analysisResult") as string;
    const analysisResult = analysisResultStr
      ? JSON.parse(analysisResultStr)
      : null;

    // バリデーション
    if (!file) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "画像ファイルが指定されていません。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!material || !VALID_MATERIALS.includes(material as Material)) {
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

    // 固定ステップを取得

    const { getStepTemplates, calculateTotalTime } = await import(
      "@/services/step-templates"
    );
    const baseSteps = getStepTemplates(analysisResult.category);
    const totalTime = calculateTotalTime(baseSteps);

    // 画像ファイルをBase64に変換
    const fileBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(fileBuffer).toString("base64");

    // 動的にステップ説明を生成
    const steps = await dynamicStepGenerator.generateDynamicDescriptions(
      baseSteps,
      analysisResult,
      base64Image
    );

    // 各ステップの検証（固定ステップは既に検証済みだが、念のため）
    const validatedSteps = steps.map((step, index) => ({
      stepNumber: step.stepNumber || index + 1,
      title: step.title || `ステップ ${index + 1}`,
      description: step.description || "",
      stepType: step.stepType || "other",
      tips: Array.isArray(step.tips) ? step.tips : [],
      estimatedDuration: Math.max(5, step.estimatedDuration || 30),
      techniques: Array.isArray(step.techniques) ? step.techniques : [],
    }));

    const response: ApiResponse<StepGenerationResponse> = {
      success: true,
      data: {
        steps: validatedSteps,
        totalEstimatedTime: Math.max(totalTime, 30), // 最低30分
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Fixed steps API error:", error);

    let errorMessage =
      "手順の取得に失敗しました。しばらく待ってから再試行してください。";
    let errorCode = "STEPS_ERROR";

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
