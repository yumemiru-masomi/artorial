import { NextRequest, NextResponse } from "next/server";
import { GeminiImageService } from "@/services/gemini-image";
import { Material } from "@/types/tutorial";
import { ApiResponse } from "@/types/api";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      originalImageUrl,
      stepNumber,
      stepDescription,
      material,
      previousStepImageUrl,
    }: {
      originalImageUrl: string;
      stepNumber: number;
      stepDescription: string;
      material: Material;
      previousStepImageUrl?: string;
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
        const fs = require("fs/promises");
        const path = require("path");
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

    // ステップに応じたプロンプトを生成
    const prompt = generateStepPrompt(stepNumber, stepDescription, material);

    // Gemini Image Serviceで画像生成
    const geminiImageService = new GeminiImageService();
    const generatedImageBuffer = await geminiImageService.generateStepImage(
      inputBuffer,
      prompt,
      previousStepImageUrl
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

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: "GENERATION_ERROR",
        message: "ステップ画像の生成に失敗しました。",
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

function generateStepPrompt(
  stepNumber: number,
  stepDescription: string,
  material: Material
): string {
  const materialStyles = {
    watercolor: "水彩画風の透明感と滲み",
    acrylic: "アクリル絵の具の厚塗りと発色",
    "colored-pencil": "色鉛筆の重ね塗りと質感",
    pencil: "鉛筆の陰影とグラデーション",
  };

  // ステップ番号に応じてプロンプトを調整
  if (stepNumber === 1) {
    // 下書き・線画段階
    return `Create a line art sketch based on this image:
- Draw clean, simple outlines
- Focus on basic shapes and proportions
- Use thin, consistent lines
- White background with black lines only
- Maintain the character's pose and composition
- Style: Simple sketch for ${material} drawing preparation`;
  } else if (
    stepDescription.includes("基本色") ||
    stepDescription.includes("ピンク")
  ) {
    // 基本色塗り段階
    return `Apply base colors to this line art:
- Fill the character with flat, solid pink base color
- Keep the black outlines visible
- Use soft, pastel pink tones
- No shading or highlights yet
- Maintain clean edges
- Style: ${materialStyles[material]}
- Focus on establishing the basic color foundation`;
  } else if (
    stepDescription.includes("陰影") ||
    stepDescription.includes("影")
  ) {
    // 陰影段階
    return `Add shadows and depth to this colored image:
- Apply realistic shadows based on light direction
- Use darker tones of the base colors
- Create form and volume
- Style: ${materialStyles[material]}
- Maintain the character's proportions`;
  } else if (
    stepDescription.includes("ハイライト") ||
    stepDescription.includes("仕上げ")
  ) {
    // ハイライト・仕上げ段階
    return `Add highlights and finishing touches:
- Apply bright highlights on raised surfaces
- Enhance the overall contrast
- Add final details and refinements
- Style: ${materialStyles[material]}
- Create a polished, finished appearance`;
  } else {
    // 一般的なステップ
    return `Continue the drawing process for step ${stepNumber}:
- Follow the instruction: ${stepDescription}
- Apply ${materialStyles[material]}
- Maintain consistency with previous steps
- Focus on gradual progression`;
  }
}
