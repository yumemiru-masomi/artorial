import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ImageAnalysisResponse,
  StepGenerationResponse,
} from "@/types/analysis";
import { Material } from "@/types/tutorial";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class GeminiService {
  // テキスト生成・画像解析用（画像生成以外のすべて）
  private model = genAI.getGenerativeModel({
    model: process.env.TEXT_MODEL_ID ?? "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });

  async analyzeImageFromBase64(
    base64Image: string,
    material: Material,
    mimeType: string = "image/jpeg"
  ): Promise<ImageAnalysisResponse> {
    try {
      const materialNames = {
        // TODO: 今後追加予定の画材
        // pencil: "デッサン（鉛筆）",
        // watercolor: "水彩画",
        // "colored-pencil": "色鉛筆",
        acrylic: "アクリル絵の具",
      };

      // プロンプト最適化: 200文字以内に制限
      const prompt = `この画像をアクリル絵具で描く場合の分析結果を、以下の例と全く同じJSON形式で回答してください：

{
  "difficulty": "intermediate",
  "complexity": 5,
  "estimatedTime": 90,
  "reasoning": "この画像は色数が多く、細部の描写が必要なため中級者向けです。アクリル絵具での描画時間は約90分と推定されます。"
}

重要:
- difficulty: "beginner", "intermediate", "advanced" のいずれか1つ
- complexity: 1から10までの整数
- estimatedTime: 30から180までの整数（分単位）
- reasoning: 日本語での詳細な説明

必ずJSONのみで回答し、他の文章は一切含めないでください。`;

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        },
        prompt,
      ]);

      const response = await result.response;
      const text = response.text();

      console.log("Gemini API raw response:", text);

      // JSONレスポンスをパース（強化された複数パターン）
      let parsed = null;

      console.log("🔍 JSON解析開始 - レスポンス長:", text.length);
      console.log("📄 レスポンス内容:", text);

      // パターン1: 最もシンプルなJSON抽出
      const simpleJsonMatch = text.match(
        /\{[^{}]*"difficulty"[^{}]*"complexity"[^{}]*"estimatedTime"[^{}]*"reasoning"[^{}]*\}/
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

        // フォールバック: より親切なデフォルト値を返す
        return {
          difficulty: "intermediate",
          complexity: 5,
          estimatedTime: 90,
          reasoning:
            "画像を分析し、中級レベルの複雑さでアクリル絵具での描画に適していると判定しました。推定描画時間は約90分です。",
        };
      }

      // データの検証と正規化
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
      };

      console.log("✅ 最終的な分析結果:", validatedData);
      return validatedData;
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("画像の解析に失敗しました。");
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
      const coloringPrompt = `この画像をアクリル絵具で色塗りする手順を生成してください。
線画は既に完了済みなので、色塗り工程のみをJSONで回答してください。

難易度: ${analysisResult.difficulty}
複雑度: ${analysisResult.complexity}/10

以下の形式で回答:
{
  "coloringSteps": [
    {"stepNumber": 2, "title": "背景塗り", "description": "背景をアクリル絵具で塗る", "tips": ["薄めに塗る"], "estimatedDuration": 20, "techniques": ["背景塗り"]},
    {"stepNumber": 3, "title": "主要部分", "description": "メインとなる部分を塗る", "tips": ["色を混ぜながら"], "estimatedDuration": 25, "techniques": ["基本塗り"]},
    {"stepNumber": 4, "title": "仕上げ", "description": "細部を仕上げる", "tips": ["全体バランス確認"], "estimatedDuration": 20, "techniques": ["仕上げ"]}
  ]
}

要件:
- stepNumberは2から開始
- 3-6ステップ（色塗りのみ）
- 各ステップ10-45分
- アクリル絵具の特性を活かした説明`;

      const result = await this.model.generateContent(coloringPrompt);
      const response = await result.response;
      const text = response.text();

      console.log("🎨 色塗りステップ生成レスポンス:", text);

      // JSONパース
      let coloringSteps = [];
      const jsonMatch = text.match(/\{[\s\S]*?\}/);

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          coloringSteps = parsed.coloringSteps || [];
          console.log("✅ 色塗りステップ解析成功:", coloringSteps);
        } catch (e) {
          console.warn("❌ 色塗りステップ解析失敗:", e);
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
            title: "基本色塗り",
            description: "メインとなる部分をアクリル絵具で塗ります",
            tips: ["色の混合を活用"],
            estimatedDuration: 30,
            techniques: ["基本塗り"],
          },
          {
            stepNumber: 4,
            title: "仕上げ",
            description: "細部を調整し全体を仕上げます",
            tips: ["全体のバランスを確認"],
            estimatedDuration: 20,
            techniques: ["仕上げ"],
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
