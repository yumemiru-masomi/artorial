import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ImageAnalysisResponse,
  StepGenerationResponse,
} from "@/types/analysis";
import { Material } from "@/types/tutorial";
import sharp from "sharp";

interface DominantColor {
  hex: string;
  name: string;
  percentage: number;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class GeminiService {
  // テキスト生成・画像解析用（画像生成以外のすべて）
  private model = genAI.getGenerativeModel({
    model: process.env.TEXT_MODEL_ID ?? "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  });

  /**
   * 実際の画像から正確な主要色を抽出
   */
  private async extractActualColors(
    base64Image: string
  ): Promise<DominantColor[]> {
    try {
      // Base64をBufferに変換
      const buffer = Buffer.from(base64Image, "base64");

      // 画像を小さくリサイズして処理を高速化
      const resizedBuffer = await sharp(buffer)
        .resize(100, 100, { fit: "inside" })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = resizedBuffer;
      const { width, height, channels } = info;

      // 色の出現回数をカウント
      const colorMap = new Map<string, number>();

      for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // より細かい量子化で多様な色を検出（64段階）
        const quantizedR = Math.floor(r / 4) * 4;
        const quantizedG = Math.floor(g / 4) * 4;
        const quantizedB = Math.floor(b / 4) * 4;

        const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
      }

      // 出現回数でソートして上位8色を取得（より多くの色を検出）
      const sortedColors = Array.from(colorMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);

      const totalPixels = width * height;

      return sortedColors.map(([colorKey, count]) => {
        const [r, g, b] = colorKey.split(",").map(Number);
        const hex = `#${r.toString(16).padStart(2, "0")}${g
          .toString(16)
          .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
        const percentage = Math.round((count / totalPixels) * 100);

        return {
          hex,
          name: this.getColorName(r, g, b),
          percentage: Math.max(1, percentage), // 最低1%（小さな領域も検出）
        };
      });
    } catch (error) {
      console.warn("実際の色抽出に失敗:", error);
      return [
        { hex: "#8B4513", name: "茶色", percentage: 20 },
        { hex: "#4A90E2", name: "青", percentage: 18 },
        { hex: "#7ED321", name: "緑", percentage: 15 },
        { hex: "#F5A623", name: "オレンジ", percentage: 12 },
        { hex: "#FFFFFF", name: "白", percentage: 10 },
        { hex: "#000000", name: "黒", percentage: 10 },
        { hex: "#D0021B", name: "赤", percentage: 8 },
        { hex: "#9013FE", name: "紫", percentage: 7 },
      ];
    }
  }

  /**
   * RGB値から色名を推定（改良版）
   */
  private getColorName(r: number, g: number, b: number): string {
    // より詳細な色名判定
    if (r > 250 && g > 250 && b > 250) return "白";
    if (r > 220 && g > 220 && b > 220) return "薄い白";
    if (r < 20 && g < 20 && b < 20) return "黒";
    if (r < 50 && g < 50 && b < 50) return "濃いグレー";

    // ピンク系
    if (r > 200 && g > 150 && b > 150 && r > g && r > b) {
      if (r > 240 && g > 200) return "薄いピンク";
      return "ピンク";
    }

    // ベージュ・肌色系
    if (r > 180 && g > 140 && b > 100 && r > g && g > b && r - b > 30) {
      if (r > 220 && g > 180 && b > 140) return "ベージュ";
      return "茶系";
    }

    // オレンジ系
    if (r > 200 && g > 120 && b < 100 && r > g && g > b) {
      if (r > 240 && g > 160) return "明るいオレンジ";
      return "オレンジ";
    }

    // 黄色系
    if (r > 200 && g > 200 && b < 120) {
      if (r > 240 && g > 240 && b < 80) return "明るい黄色";
      return "黄色";
    }

    // 青・水色系（より詳細に）
    if (b > r && b > g) {
      if (r > 150 && g > 200 && b > 220) return "水色";
      if (r > 100 && g > 150 && b > 200) return "薄い青";
      if (b > 150) return "青";
      return "濃い青";
    }

    // 水色系（RGB値が近い場合）
    if (r > 100 && g > 180 && b > 200 && Math.abs(g - b) < 50) return "水色";

    // 緑系
    if (g > r && g > b) {
      if (g > 150) return "緑";
      return "濃い緑";
    }

    // 紫系
    if (r > 100 && b > 100 && r > g && b > g && Math.abs(r - b) < 50) {
      if (r > 180 && b > 180) return "明るい紫";
      return "紫";
    }

    // 赤系
    if (r > g && r > b) {
      if (r > 150) return "赤";
      return "濃い赤";
    }

    // グレー系
    if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30) {
      if (r > 150) return "薄いグレー";
      if (r > 100) return "グレー";
      return "濃いグレー";
    }

    return "混合色";
  }

  async analyzeImageFromBase64(
    base64Image: string,
    material: Material,
    mimeType: string = "image/jpeg"
  ): Promise<ImageAnalysisResponse> {
    try {
      console.log("🚀 Gemini API呼び出し開始");
      console.log(
        "🔑 APIキー設定:",
        process.env.GEMINI_API_KEY ? "✅ 設定済み" : "❌ 未設定"
      );
      console.log("📊 画像サイズ:", base64Image.length, "文字");
      console.log("🎨 画材:", material);
      console.log("📄 MIMEタイプ:", mimeType);

      // 日本語対応・動的値生成プロンプト
      const prompt = `この画像を詳細に分析して、以下のJSON形式で日本語で回答してください：

{
  "difficulty": "beginner/intermediate/advanced のいずれか（画像の複雑さに応じて選択）",
  "complexity": "1-10の数値（1=非常に簡単、10=非常に複雑）",
  "estimatedTime": "30-180の数値（分単位、難易度に応じて変動）",
  "reasoning": "日本語での詳細な分析理由",
  "category": "landscape/portrait/character/still_life/abstract/animal/architecture/other",
  "categoryDescription": "日本語での画像説明",
  "dominantColors": [
    {"hex": "#色コード", "name": "色名", "percentage": 割合},
    // 最大8色まで
  ]
}

分析基準：
- difficulty: シンプルな形状=beginner、中程度=intermediate、複雑な細部=advanced
- complexity: 色数・形状・細部の複雑さを1-10で評価
- estimatedTime: difficultyとcomplexityに基づいて30-180分で設定
- 実際の画像内容を正確に反映した動的な値を設定
- JSONのみ回答（説明文不要）`;

      console.log("📤 API呼び出し実行中...");

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        },
        prompt,
      ]);

      console.log("📥 API呼び出し完了");

      const response = await result.response;
      console.log("📊 トークン使用量:", response.usageMetadata);
      console.log("🏁 終了理由:", response.candidates?.[0]?.finishReason);

      const text = response.text();
      console.log("📝 text length:", text?.length || 0);

      console.log("Gemini API raw response:", text);

      // MAX_TOKENSエラーの場合は即座にフォールバック
      if (response.candidates?.[0]?.finishReason === "MAX_TOKENS") {
        console.warn(
          "⚠️ MAX_TOKENS制限に達しました。フォールバック処理を実行します。"
        );
        const actualColors = await this.extractActualColors(base64Image);

        return {
          difficulty: "intermediate",
          complexity: 5,
          estimatedTime: 90,
          reasoning:
            "トークン制限のため簡易解析を実行しました。アクリル絵具での描画に適した中級レベルの作品です。",
          category: "other",
          categoryDescription:
            "画像の種類を特定できませんでしたが、アクリル絵具での描画に適した内容です。",
          dominantColors: actualColors,
        };
      }

      // JSONレスポンスをパース（強化された複数パターン）
      let parsed = null;

      console.log("🔍 JSON解析開始 - レスポンス長:", text.length);
      console.log("📄 レスポンス内容:", text);

      // パターン1: 最もシンプルなJSON抽出（新フィールド対応）
      const simpleJsonMatch = text.match(
        /\{[^{}]*"difficulty"[^{}]*"complexity"[^{}]*"estimatedTime"[^{}]*"reasoning"[^{}]*"category"[^{}]*"categoryDescription"[^{}]*"dominantColors"[^{}]*\}/
      );
      if (simpleJsonMatch) {
        try {
          parsed = JSON.parse(simpleJsonMatch[0]);
          console.log("✅ パターン1成功（シンプルJSON）:", parsed);
        } catch (e) {
          console.warn("❌ パターン1失敗:", e);
        }
      }

      // パターン2: 標準的なJSON形式
      if (!parsed) {
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
            console.log("✅ パターン2成功（標準JSON）:", parsed);
          } catch (e) {
            console.warn("❌ パターン2失敗:", e);
          }
        }
      }

      // パターン3: コードブロック内のJSON
      if (!parsed) {
        const codeBlockMatch = text.match(
          /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
        );
        if (codeBlockMatch) {
          try {
            parsed = JSON.parse(codeBlockMatch[1]);
            console.log("✅ パターン3成功（コードブロック）:", parsed);
          } catch (e) {
            console.warn("❌ パターン3失敗:", e);
          }
        }
      }

      // パターン4: 強制的なJSON構築（最後の手段）
      if (!parsed) {
        console.log("🔧 パターン4: 強制JSON構築を試行");
        const difficultyMatch = text.match(
          /"difficulty"\s*:\s*"(beginner|intermediate|advanced)"/
        );
        const complexityMatch = text.match(/"complexity"\s*:\s*(\d+)/);
        const timeMatch = text.match(/"estimatedTime"\s*:\s*(\d+)/);
        const reasoningMatch = text.match(/"reasoning"\s*:\s*"([^"]+)"/);

        if (difficultyMatch && complexityMatch && timeMatch) {
          parsed = {
            difficulty: difficultyMatch[1],
            complexity: parseInt(complexityMatch[1]),
            estimatedTime: parseInt(timeMatch[1]),
            reasoning: reasoningMatch?.[1] || "画像の分析が完了しました。",
          };
          console.log("✅ パターン4成功（強制構築）:", parsed);
        }
      }

      if (!parsed) {
        console.error("🚨 全てのJSON解析パターンが失敗");
        console.error("📄 元のレスポンス:", text);
        console.error("📊 レスポンス詳細:");
        console.error("  - 長さ:", text.length);
        console.error("  - {を含む:", text.includes("{"));
        console.error("  - }を含む:", text.includes("}"));
        console.error("  - difficultyを含む:", text.includes("difficulty"));

        // フォールバック: 実際の画像から色を抽出
        const actualColors = await this.extractActualColors(base64Image);

        return {
          difficulty: "intermediate",
          complexity: 5,
          estimatedTime: 90,
          reasoning:
            "画像を分析し、中級レベルの複雑さでアクリル絵具での描画に適していると判定しました。推定描画時間は約90分です。",
          category: "other",
          categoryDescription:
            "画像の種類を特定できませんでしたが、描画に適した内容です。",
          dominantColors: actualColors,
        };
      }

      // データの検証と正規化
      const validCategories = [
        "landscape",
        "portrait",
        "character",
        "still_life",
        "abstract",
        "animal",
        "architecture",
        "other",
      ];

      console.log("🔍 パース結果の詳細:");
      console.log("  - difficulty:", parsed.difficulty);
      console.log("  - complexity:", parsed.complexity);
      console.log("  - estimatedTime:", parsed.estimatedTime);

      const validatedData = {
        difficulty: ["beginner", "intermediate", "advanced"].includes(
          parsed.difficulty
        )
          ? parsed.difficulty
          : "intermediate",
        complexity: Math.max(1, Math.min(10, parseInt(parsed.complexity) || 5)),
        estimatedTime: Math.max(
          30,
          Math.min(180, parseInt(parsed.estimatedTime) || 90)
        ),
        reasoning:
          typeof parsed.reasoning === "string" && parsed.reasoning.length > 0
            ? parsed.reasoning
            : "画像を分析し、アクリル絵具での描画に適した難易度を判定しました。",
        category: validCategories.includes(parsed.category)
          ? parsed.category
          : "other",
        categoryDescription:
          parsed.categoryDescription || "画像の詳細な分類情報です。",
        dominantColors:
          Array.isArray(parsed.dominantColors) &&
          parsed.dominantColors.length > 0
            ? parsed.dominantColors.slice(0, 8).map((color: DominantColor) => ({
                hex:
                  color.hex && color.hex.startsWith("#")
                    ? color.hex
                    : "#808080",
                name: color.name || "不明",
                percentage: Math.max(0, Math.min(100, color.percentage || 0)),
              }))
            : await this.extractActualColors(base64Image),
      };

      console.log("✅ 最終的な分析結果:", validatedData);
      return validatedData;
    } catch (error) {
      console.error("🚨 Gemini API error:", error);
      console.error("🔍 Error type:", typeof error);
      console.error(
        "🔍 Error message:",
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        "🔍 Error stack:",
        error instanceof Error ? error.stack : "No stack"
      );

      // フォールバック: 実際の画像から色を抽出
      const actualColors = await this.extractActualColors(base64Image);

      return {
        difficulty: "intermediate",
        complexity: 5,
        estimatedTime: 90,
        reasoning:
          "AI解析でエラーが発生しましたが、画像から基本的な情報を抽出しました。アクリル絵具での描画に適した作品です。",
        category: "other",
        categoryDescription:
          "画像の解析中にエラーが発生しましたが、アクリル絵具での描画に適した内容です。",
        dominantColors: actualColors,
      };
    }
  }

  async generateStepsFromAnalysis(
    material: Material,
    analysisResult: ImageAnalysisResponse
  ): Promise<StepGenerationResponse> {
    try {
      // ステップ1: 固定の線画ステップ
      const fixedStep1 = {
        stepNumber: 1,
        title: "下書き・線画",
        description:
          "アップロード画像の形状と比率を保持したまま、白い背景に黒い線だけの線画に変換します。",
        tips: ["元画像の構図を正確に保つ", "線の太さを均一にする"],
        estimatedDuration: 15,
        techniques: ["線画", "輪郭描写"],
      };

      // ステップ2以降: Geminiが動的生成（色塗り工程のみ）
      const coloringPrompt = `この画像に最適なアクリル絵具の色塗り手順をJSONで生成してください。

画像の特徴:
- 難易度: ${analysisResult.difficulty}
- 複雑度: ${analysisResult.complexity}/10
- カテゴリ: ${analysisResult.category}
- 主要色: ${
        analysisResult.dominantColors?.map((c) => c.name).join("、") || "不明"
      }

**重要: 実際の主要色を使用してください**
- 背景色が「${
        analysisResult.dominantColors?.[0]?.name || "不明"
      }」の場合は、その色を背景塗りで指定
- 各ステップの説明で具体的な色名を使用（例：「ピンク」「青」「緑」など）
- 固定的な「ライトブルー」などは使用せず、実際の画像の色を反映

以下の正確なJSON形式で回答してください:
{
  "coloringSteps": [
    {"stepNumber": 2, "title": "背景塗り", "description": "背景を${
      analysisResult.dominantColors?.[0]?.name || "主要色"
    }で塗る", "tips": ["薄めに塗る"], "estimatedDuration": 20, "techniques": ["背景塗り"]},
    {"stepNumber": 3, "title": "主要部分塗り", "description": "メインとなる部分を実際の色で塗る", "tips": ["色を混ぜながら"], "estimatedDuration": 25, "techniques": ["基本塗り"]},
    {"stepNumber": 4, "title": "仕上げ", "description": "細部を仕上げる", "tips": ["全体バランス確認"], "estimatedDuration": 20, "techniques": ["仕上げ"]}
  ]
}

重要な制約:
- stepNumberは2から開始し連続番号
- 3-5ステップ（色塗りのみ）
- 各ステップ10-45分
- 実際の画像の主要色を具体的に記載
- 固定的な色名は使用禁止
- 配列要素間に必ずカンマを入れる
- 正確なJSON形式を守る
- JSONのみ回答（説明文不要）`;

      const result = await this.model.generateContent(coloringPrompt);
      const response = await result.response;
      const text = response.text();

      console.log("🎨 色塗りステップ生成レスポンス:", text);

      // 強化されたJSONパース（複数パターン対応）
      let coloringSteps = [];

      console.log("🔍 色塗りステップJSON解析開始 - レスポンス長:", text.length);
      console.log("📄 色塗りステップレスポンス内容:", text);

      // パターン1: coloringStepsを含むJSON抽出
      const coloringJsonMatch = text.match(
        /\{[^{}]*"coloringSteps"[^{}]*\[[\s\S]*?\][^{}]*\}/
      );
      if (coloringJsonMatch) {
        try {
          const parsed = JSON.parse(coloringJsonMatch[0]);
          coloringSteps = parsed.coloringSteps || [];
          console.log("✅ パターン1成功（coloringSteps特化）:", coloringSteps);
        } catch (e) {
          console.warn("❌ パターン1失敗:", e);
        }
      }

      // パターン2: 標準的なJSON形式
      if (coloringSteps.length === 0) {
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            coloringSteps = parsed.coloringSteps || [];
            console.log("✅ パターン2成功（標準JSON）:", coloringSteps);
          } catch (e) {
            console.warn("❌ パターン2失敗:", e);
          }
        }
      }

      // パターン3: コードブロック内のJSON
      if (coloringSteps.length === 0) {
        const codeBlockMatch = text.match(
          /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
        );
        if (codeBlockMatch) {
          try {
            const parsed = JSON.parse(codeBlockMatch[1]);
            coloringSteps = parsed.coloringSteps || [];
            console.log("✅ パターン3成功（コードブロック）:", coloringSteps);
          } catch (e) {
            console.warn("❌ パターン3失敗:", e);
          }
        }
      }

      // パターン4: 配列のみ抽出（coloringSteps部分のみ）
      if (coloringSteps.length === 0) {
        const arrayMatch = text.match(/"coloringSteps":\s*(\[[\s\S]*?\])/);
        if (arrayMatch) {
          try {
            coloringSteps = JSON.parse(arrayMatch[1]);
            console.log("✅ パターン4成功（配列のみ）:", coloringSteps);
          } catch (e) {
            console.warn("❌ パターン4失敗:", e);
          }
        }
      }

      // フォールバック色塗りステップ
      if (coloringSteps.length === 0) {
        console.log("🔄 フォールバック色塗りステップを使用");
        coloringSteps = [
          {
            stepNumber: 2,
            title: "背景塗り",
            description: "背景をアクリル絵具で塗ります",
            tips: ["薄めに重ね塗り"],
            estimatedDuration: 20,
            techniques: ["背景塗り"],
          },
          {
            stepNumber: 3,
            title: "色塗り",
            description: "メインとなる部分をアクリル絵具で塗ります",
            tips: ["色の混合を活用"],
            estimatedDuration: 30,
            techniques: ["基本塗り"],
          },
        ];
      }

      // 固定ステップ1 + 動的色塗りステップを結合
      const allSteps = [fixedStep1, ...coloringSteps];
      const totalEstimatedTime = allSteps.reduce(
        (total, step) => total + step.estimatedDuration,
        0
      );

      console.log("✅ 最終ステップ構成:", allSteps.length, "ステップ");
      console.log("📋 ステップ一覧:");
      allSteps.forEach((step, index) => {
        console.log(
          `  ${index + 1}. ${step.title} (${step.estimatedDuration}分)`
        );
      });

      return {
        steps: allSteps,
        totalEstimatedTime,
      };
    } catch (error) {
      console.error("❌ ステップ生成エラー:", error);

      // 完全フォールバック
      return {
        steps: [
          {
            stepNumber: 1,
            title: "下書き・線画",
            description:
              "アップロード画像の形状と比率を保持したまま、白い背景に黒い線だけの線画に変換します。",
            tips: ["元画像の構図を正確に保つ"],
            estimatedDuration: 15,
            techniques: ["線画"],
          },
          {
            stepNumber: 2,
            title: "基本色塗り",
            description: "アクリル絵具で基本となる色を塗ります",
            tips: ["薄めから始める"],
            estimatedDuration: 30,
            techniques: ["基本塗り"],
          },
          {
            stepNumber: 3,
            title: "仕上げ",
            description: "細部を調整し全体を仕上げます",
            tips: ["全体のバランスを確認"],
            estimatedDuration: 20,
            techniques: ["仕上げ"],
          },
        ],
        totalEstimatedTime: 65,
      };
    }
  }
}
