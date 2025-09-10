import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが必要です" },
        { status: 400 }
      );
    }

    // ファイルをBase64に変換
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    console.log("Gemini 2.5 Flash Image Preview処理開始...");

    // Gemini APIを直接呼び出す関数
    const generateImage = async (prompt: string) => {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "x-goog-api-key": GEMINI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64,
                  },
                },
              ],
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

    // 線画のみ生成
    const lineArtPrompt =
      "Convert this image to a simple black line art drawing on white background";

    console.log("線画生成中...");
    const lineArtImage = await generateImage(lineArtPrompt);

    console.log("Gemini線画生成完了");

    return NextResponse.json({
      success: true,
      results: {
        lineArt: lineArtImage,
        flat: null,
        shaded: null,
      },
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
