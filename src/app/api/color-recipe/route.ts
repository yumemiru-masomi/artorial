import { NextRequest, NextResponse } from "next/server";
import { colorMixerService } from "@/services/color-mixer";
import { ApiResponse } from "@/types/api";
import { ColorRecipeResponse } from "@/types/color-recipe";

// 数学的計算なので高速処理（タイムアウト不要）

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { targetHex } = await request.json();

    // バリデーション
    if (!targetHex || typeof targetHex !== "string") {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "ターゲット色のHEXコードが指定されていません。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // HEXコードの形式チェック
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    if (!hexPattern.test(targetHex)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "有効なHEXコード形式ではありません（例: #FF0000）。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 数学的計算による混色レシピ生成（APIを使わない高速処理）
    console.log("🎨 数学的混色計算開始:", targetHex);
    const colorRecipe = colorMixerService.calculateColorRecipe(targetHex);

    console.log("✅ 混色レシピ取得成功:", colorRecipe);

    const successResponse: ApiResponse<ColorRecipeResponse> = {
      success: true,
      data: colorRecipe,
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("🚨 混色計算エラー:", error);

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: "COLOR_RECIPE_ERROR",
        message: "混色レシピの計算中にエラーが発生しました。",
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
