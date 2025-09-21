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
    const prompt = generateStepPrompt(stepNumber, stepDescription);

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
  stepDescription: string
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
    return `**【重要】この画像を厳密に白(#FFFFFF)と黒(#000000)の2色のみで構成されたモノクロ画像に変換してください。青色やグレーは絶対に使用禁止です。**

【最重要：色の制約】
- 使用できる色は厳密に2色のみ：
  - 黒色：#000000（RGB 0,0,0）
  - 白色：#FFFFFF（RGB 255,255,255）
- 青色、グレー、薄い色、その他の色は一切使用禁止

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

**【絶対に守ること】**
1. 元画像で黒い部分があっても、絶対に内部を黒で塗らない
2. すべての要素は「枠線のみ」で表現する
3. 内部は必ず白いまま残す
4. 塗り絵として後で色を塗れるようにする

**【技術仕様】**
- 出力：PNG、モノクロ2値、白背景、すべての要素は輪郭線（枠線）のみで表現

**【最終確認】**
1. 画像に使用されている色が黒(#000000)と白(#FFFFFF)の2色のみであることを確認
2. 青色、グレー、薄い色が一切含まれていないことを確認
3. 完全なモノクロ2値画像であることを確認
4. カラーパレットが2色に制限されていることを確認

**【絶対条件】**
- すべての要素は輪郭線（枠線）のみで表現する
- 必ず純粋な白(#FFFFFF)と純粋な黒(#000000)のみで構成する`;
  }

  // ステップ2以降: 汎用的な段階的塗り分けプロンプト
  else {
    console.log("✅ 汎用的な段階的塗り分けプロンプトを使用");
    console.log("🔍 ステップ説明:", stepDescription);

    // 背景専用
    if (
      stepDescription.includes("背景") ||
      stepDescription.includes("空") ||
      stepDescription.includes("遠景") ||
      stepDescription.includes("ベース塗り") ||
      stepDescription.includes("下地") ||
      stepDescription.includes("全体の色調")
    ) {
      console.log("✅ 背景専用プロンプトを選択");
      return `**【重要】線画に元画像の背景色のみを追加してください**

この作業は「線画 + 元画像の背景色」を組み合わせる工程です：

【実行する手順】
"${stepDescription}"

**【作業の流れ】**
1. 前ステップで生成された線画（白背景+黒線）を基準にする
2. 元画像の背景部分の色・パターンのみを線画に追加する
3. 線画の黒い線は絶対に変更・塗りつぶししない

**【絶対に守る原則】**
- 線画の黒い輪郭線は一切変更しない（塗りつぶし禁止）
- 前景のキャラクター・人物・物体は白いまま残す（線画状態を保持）
- 背景部分のみに元画像と同じ色を塗る

【背景色の追加方法】
- 元画像の背景色・パターン・グラデーションを正確に再現
- 背景の形状・配置・色調を一切変更しない
- 線画の輪郭線を保持したまま、背景領域のみに色を追加
- 前景と背景の境界は線画の輪郭線で明確に区別

【絶対に禁止すること】
- 線画の黒い線を塗りつぶすこと
- 前景（キャラクター・人物・物体）に色を塗ること
- 背景色を勝手にアレンジ・変更すること
- 元画像にない色や形状を追加すること

【最終結果】
- 背景：元画像と同じ色・パターン
- 前景：白い塗り絵状態（線画のまま）
- 輪郭線：黒いまま保持`;
    }
    // 特定の領域専用（肌・顔・建物・物体など）
    else if (
      stepDescription.includes("肌") ||
      stepDescription.includes("顔") ||
      stepDescription.includes("建物") ||
      stepDescription.includes("物体") ||
      stepDescription.includes("静物")
    ) {
      return `アクリル絵具で【指定領域のみ】を塗ってください：

【実行する手順】
"${stepDescription}"

【塗り分けルール】
- 指定領域（例：肌・顔・建物・物体など）だけを塗る
- 他の領域は線画のまま残す
- 輪郭線は保持し、未塗り部分は白く残す

【塗り方】
- 自然で調和の取れた色でアクリル絵具らしく塗る
- 適度な厚み（インパスト）、筆跡を残した自然な質感
- 前のステップとの一貫性を保つ
- PNG形式で出力

重要：指定以外の領域は絶対に塗らないでください。`;
    }
    // その他（汎用）
    else {
      return `アクリル絵具で段階的に塗り分けを実行してください：

【実行する手順】
"${stepDescription}"

【基本ルール】
- 元画像の形状・比率・構図を厳密に維持
- 各ステップごとに対象領域だけを塗り、他は線画として保持
- アクリル絵具の特徴を活かす
  - 適度な厚み（インパスト）
  - 筆跡が残る自然な質感
  - マット〜半光沢の仕上がり
  - 色の重ね塗り・混合による表現
- 前ステップとの一貫性を保つ
- PNG形式で出力

重要：このステップで指定された範囲以外は絶対に塗らないでください。`;
    }
  }
}
