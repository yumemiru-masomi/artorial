import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/services/gemini";
import { colorExtractorService } from "@/services/color-extractor";
import { ApiResponse } from "@/types/api";
import { ImageAnalysisResponse } from "@/types/analysis";
import { Material } from "@/types/tutorial";
import sharp from "sharp";

const VALID_MATERIALS: Material[] = [
  // TODO: 今後追加予定の画材
  // 'pencil', 'watercolor', 'colored-pencil',
  "acrylic",
];
const ANALYSIS_TIMEOUT = 30000; // 30秒

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const material = formData.get("material") as string;

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

    // Gemini APIキーの確認
    if (!process.env.GEMINI_API_KEY) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "ANALYSIS_ERROR",
          message: "AI解析サービスが設定されていません。",
        },
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // ファイルを最適化してからBase64に変換（処理時間短縮）
    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    // 画像を最適化（サイズ縮小・品質調整）
    const optimizedBuffer = await sharp(originalBuffer)
      .resize(800, 600, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 75, // 品質を下げて処理時間短縮
        progressive: true,
      })
      .toBuffer();

    const base64Image = optimizedBuffer.toString("base64");
    console.log(
      `📊 画像最適化: ${originalBuffer.length} → ${optimizedBuffer.length} bytes`
    );

    const geminiService = new GeminiService();

    // 即座に色抽出を開始（フォールバック用）
    const quickColorExtractionPromise =
      colorExtractorService.extractColorsFromBuffer(optimizedBuffer);

    // タイムアウト付きで解析実行
    const analysisPromise = geminiService.analyzeImageFromBase64(
      base64Image,
      material as Material,
      file.type
    );
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("TIMEOUT"));
      }, ANALYSIS_TIMEOUT);
    });

    try {
      const analysisResult = await Promise.race([
        analysisPromise,
        timeoutPromise,
      ]);

      // 解析結果の検証
      if (
        !analysisResult.difficulty ||
        typeof analysisResult.complexity !== "number"
      ) {
        throw new Error("Invalid analysis result");
      }

      const response: ApiResponse<ImageAnalysisResponse> = {
        success: true,
        data: {
          difficulty: analysisResult.difficulty,
          complexity: Math.max(1, Math.min(10, analysisResult.complexity)), // 1-10の範囲に制限
          estimatedTime: Math.max(30, analysisResult.estimatedTime || 60), // 最低30分
          reasoning: analysisResult.reasoning || "分析が完了しました。",
          category: analysisResult.category,
          categoryDescription: analysisResult.categoryDescription,
          dominantColors: analysisResult.dominantColors || [],
        },
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "TIMEOUT") {
        console.log("⚠️ Gemini API タイムアウト - フォールバック色抽出を使用");

        // タイムアウト時はフォールバック色抽出を使用
        try {
          const quickColors = await quickColorExtractionPromise;

          const fallbackResponse: ApiResponse<ImageAnalysisResponse> = {
            success: true,
            data: {
              difficulty: "intermediate",
              complexity: 5,
              estimatedTime: 90,
              reasoning:
                "処理時間の関係で簡易解析を実行しました。画像から抽出した色情報を基に中級レベルと判定しています。",
              category: "other",
              categoryDescription:
                "画像の詳細分析は時間の関係で省略されましたが、描画に適した内容です。",
              dominantColors: quickColors.map((color) => ({
                hex: color.hex,
                name: color.name,
                percentage: color.percentage,
              })),
            },
          };

          console.log(
            "✅ フォールバック解析完了:",
            fallbackResponse.data?.dominantColors?.length || 0,
            "色"
          );
          return NextResponse.json(fallbackResponse);
        } catch (fallbackError) {
          console.error("❌ フォールバック色抽出も失敗:", fallbackError);

          const errorResponse: ApiResponse<null> = {
            success: false,
            error: {
              code: "TIMEOUT_ERROR",
              message:
                "処理に時間がかかりすぎています。画像サイズを小さくしてお試しください。",
            },
          };
          return NextResponse.json(errorResponse, { status: 408 });
        }
      }

      throw error; // 他のエラーは外側のcatchブロックで処理
    }
  } catch (error) {
    console.error("Analysis API error:", error);

    let errorMessage = "画像の解析に失敗しました。別の画像をお試しください。";
    let errorCode = "ANALYSIS_ERROR";

    if (error instanceof Error) {
      if (
        error.message.includes("API key") ||
        error.message.includes("quota")
      ) {
        errorMessage =
          "AI解析サービスでエラーが発生しました。しばらく待ってから再試行してください。";
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
