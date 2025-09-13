import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const step = (formData.get("step") as string) || "lineArt";
    const lineArtFile = formData.get("lineArt") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが必要です" },
        { status: 400 }
      );
    }

    // ファイルをBase64に変換
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // 線画ファイルがある場合はBase64に変換
    let lineArtBase64: string | null = null;
    if (lineArtFile) {
      const lineArtBytes = await lineArtFile.arrayBuffer();
      lineArtBase64 = Buffer.from(lineArtBytes).toString("base64");
    }

    console.log("Gemini 2.5 Flash Image Preview処理開始...");

    // Gemini APIを直接呼び出す関数
    const generateImage = async (prompt: string) => {
      // partsを動的に構築
      const parts: Array<{
        text?: string;
        inlineData?: { mimeType: string; data: string };
      }> = [
        {
          text: prompt,
        },
        {
          inlineData: {
            mimeType: file.type,
            data: base64,
          },
        },
      ];

      // ベタ塗りの場合で線画データがある場合、線画も追加
      if (step === "flat" && lineArtBase64) {
        parts.push({
          inlineData: {
            mimeType: "image/png", // 線画はPNGと仮定
            data: lineArtBase64,
          },
        });
      }

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "x-goog-api-key": GEMINI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: parts,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // 生成された画像データを取得
      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts
      ) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    };

    // ステップに応じた画像生成
    let prompt: string;
    let stepName: string;

    switch (step) {
      case "lineArt":
        prompt =
          "Convert this image to a simple black line art drawing on white background";
        stepName = "線画";
        break;
      case "flat":
        prompt = `目的： 線画の内側を、パステル調の均一な色面で塗り分けた"ベタ塗り段階"の見本画像を作る。影・ハイライト・質感は入れない。

次の2枚を参照して、ベタ塗り段階の画像を1枚生成してください。
- 画像A：元画像（参考用）
- 画像B：白背景の黒線の線画（あれば使用。なければ元画像のみの参考にする）

必須要件：
- 線画（画像B）の**線の内側のみ**を塗る。線は黒のまま残す（1〜2px相当、途切れなし）。
- **影・ハイライト・反射・テクスチャ・ノイズ・ディザ** は**入れない**（完全にフラット）。
- 背景は元画像の背景に準ずる 背景がなければ**白**（または #FFF）にする。
- 構図・比率・アウトライン位置は元の線画を厳密に維持。
- 出力は **PNG 1枚**。

色指定：
- 画像に使用されてる色と必ず同じ色を使用する。

禁止事項（重要）：
- 影、ハイライト、半透明の塗り、ぼかし、光沢、にじみ、紙目、ブラシストローク、模様、文字、透かし。
- オブジェクトの追加、構図変更、切り抜き、キャラ差し替え。`;
        stepName = "ベタ塗り";
        break;
      case "shaded":
        prompt =
          "Convert this image to a fully shaded anime/manga style illustration with highlights and shadows";
        stepName = "陰影付き";
        break;
      default:
        prompt =
          "Convert this image to a simple black line art drawing on white background";
        stepName = "線画";
    }

    console.log(`${stepName}生成中...`);
    const generatedImage = await generateImage(prompt);

    console.log(`Gemini${stepName}生成完了`);

    return NextResponse.json({
      success: true,
      step: step,
      image: generatedImage,
      method: "gemini-image-generation",
    });
  } catch (error) {
    console.error("Gemini Vision処理エラー:", error);
    return NextResponse.json(
      {
        error: "Gemini Vision処理中にエラーが発生しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
