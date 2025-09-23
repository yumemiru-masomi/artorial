import { NextRequest, NextResponse } from "next/server";
import { colorMixerService } from "@/services/color-mixer";

/**
 * 混色計算のテスト用エンドポイント
 * 開発・デバッグ用
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const testColor = searchParams.get("color") || "#FF6B6B";

  console.log("🧪 混色計算テスト:", testColor);

  try {
    const result = colorMixerService.calculateColorRecipe(testColor);

    return NextResponse.json({
      success: true,
      testColor,
      result,
      performance: {
        message: "数学的計算により瞬時に完了",
        apiUsed: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { colors } = await request.json();

    if (!Array.isArray(colors)) {
      return NextResponse.json(
        {
          success: false,
          error: "colors配列が必要です",
        },
        { status: 400 }
      );
    }

    const results = colors.map((color: string) => ({
      color,
      recipe: colorMixerService.calculateColorRecipe(color),
    }));

    return NextResponse.json({
      success: true,
      batchResults: results,
      performance: {
        message: `${colors.length}色を瞬時に計算完了`,
        apiUsed: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
