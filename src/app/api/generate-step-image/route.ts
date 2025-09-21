import { NextRequest, NextResponse } from "next/server";
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

    // プロンプト生成
    const prompt = generateStepPrompt(stepNumber, stepDescription, material);

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

function generateStepPrompt(
  stepNumber: number,
  stepDescription: string,
  material: Material
): string {
  console.log(
    `🎨 プロンプト生成: ステップ${stepNumber}, 説明: "${stepDescription}"`
  );

  // ステップ1: 線画（下書き）- 固定プロンプト
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
    console.log("✅ 線画プロンプトを使用");
    return `この画像を完全に白黒の線画に変換してください。

【絶対に守る色の制約】
- 使用できる色は2色のみ：
  - 線：純粋な黒色（#000000、RGB(0,0,0)）のみ
  - 背景：純粋な白色（#FFFFFF、RGB(255,255,255)）のみ
- 青色、グレー、その他の色は絶対に使用禁止
- カラー情報を完全に除去し、モノクロ2値化する

【形状保持の要件】
- 元画像の形状、比率、構図を一切変更しない
- すべての要素の位置、サイズ、角度を正確に保持する
- トリミング、拡大縮小、回転は禁止

【線画の仕様】
- 線の太さ：1-2px程度の均一な太さ
- 線の種類：連続した滑らかな黒い線のみ
- 塗りつぶし：一切禁止（背景の白以外は全て線のみ）
- アンチエイリアシング：使用しない（完全な2値化）

【重要：塗りつぶし禁止ルール】
- 目の瞳、服、髪など、元画像で暗い部分も塗りつぶさない
- すべての要素は輪郭線（枠線）のみで表現する
- 内部は白いまま残し、境界線だけを黒い線で描く
- 例：目の瞳 → 瞳の輪郭線のみ、内部は白
- 例：黒い服 → 服の輪郭線のみ、内部は白

【処理方法】
1. 元画像の色情報を完全に除去
2. すべての要素の輪郭（境界線）のみを純粋な黒い線で描く
3. どんなに暗い部分でも塗りつぶしは行わず、枠線のみ描画
4. 内部は全て白色のまま残す
5. 最終的に白い背景に黒い輪郭線のみの画像にする

【出力形式】
- PNG形式
- 元画像と同じ縦横比
- 透明度なし（白背景）
- カラーモード：モノクロ2値

重要：
1. 青色やその他の色が混入した場合は、必ず純粋な黒色（#000000）に変換してください。
2. 白と黒以外の色は絶対に使用しないでください。
3. どんな部分も塗りつぶさず、すべて輪郭線（枠線）のみで表現してください。
4. 目の瞳、服、髪などの暗い部分も内部は白いまま残し、境界線のみを黒で描いてください。

この線画は塗り絵の下書きとして使用されるため、すべての内部領域を白いまま残すことが重要です。`;
  }

  // ステップ2以降: 段階的塗り分けプロンプト
  else {
    console.log("✅ 段階的塗り分けプロンプトを使用");

    // ステップの内容に応じて塗る範囲を制限
    if (stepDescription.includes("背景")) {
      return `アクリル絵具で背景のみを塗ってください：

【実行する手順】
"${stepDescription}"

【重要：塗り分けルール】
- 背景部分のみをアクリル絵具で塗る
- キャラクター（人物）部分は一切塗らず、線画のまま残す
- キャラクターの輪郭線は保持し、内部は白いまま残す
- 背景とキャラクターの境界線を明確に区別する

【背景の塗り方】
- 元画像の形状、比率、構図を維持
- アクリル絵具の質感と特性を活かした表現
  - 適度な厚み（インパスト）のある塗り
  - マットから半光沢の仕上がり
  - 色の混合と重ね塗りによる豊かな表現
  - 筆跡が残る自然な質感
- PNG形式で出力

重要：キャラクター部分は次のステップで塗るため、この段階では絶対に塗らないでください。`;
    } else if (
      stepDescription.includes("肌") ||
      stepDescription.includes("顔")
    ) {
      return `アクリル絵具で肌・顔部分のみを塗ってください：

【実行する手順】
"${stepDescription}"

【重要：塗り分けルール】
- 肌・顔部分のみをアクリル絵具で塗る
- 髪、服、靴などの他の部分は線画のまま残す
- 各部分の輪郭線は保持し、塗らない部分は白いまま残す

【肌の塗り方】
- 自然な肌色でアクリル絵具の質感を活かす
- 適度な厚み（インパスト）のある塗り
- 前のステップとの一貫性を保つ
- PNG形式で出力

重要：他の部分は後のステップで塗るため、この段階では絶対に塗らないでください。`;
    } else {
      return `アクリル絵具での描画ステップを実行してください：

【実行する手順】
"${stepDescription}"

【基本制約】
- 元画像の形状、比率、構図を維持してください
- アクリル絵具の質感と特性を活かした表現にしてください
  - 適度な厚み（インパスト）のある塗り
  - マットから半光沢の仕上がり
  - 色の混合と重ね塗りによる豊かな表現
  - 筆跡が残る自然な質感
- 前のステップとの一貫性を保ってください
- PNG形式で出力してください

この手順に最適な方法を考えて、アクリル絵具らしい質感で創造的に実行してください。`;
    }
  }
}
