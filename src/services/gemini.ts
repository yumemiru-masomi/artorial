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
      const prompt = `${
        materialNames[material as keyof typeof materialNames] ||
        materialNames.acrylic
      }で描く分析をJSONで:
{
  "difficulty": "beginner"|"intermediate"|"advanced",
  "complexity": 1-10,
  "estimatedTime": 分,
  "reasoning": "理由"
}`;

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

      // JSONレスポンスをパース（複数のパターンを試行）
      let parsed = null;

      // パターン1: 標準的なJSON形式
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn("Standard JSON parse failed:", e);
        }
      }

      // パターン2: コードブロック内のJSON
      if (!parsed) {
        const codeBlockMatch = text.match(
          /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
        );
        if (codeBlockMatch) {
          try {
            parsed = JSON.parse(codeBlockMatch[1]);
          } catch (e) {
            console.warn("Code block JSON parse failed:", e);
          }
        }
      }

      // パターン3: 最後のJSON-likeオブジェクト
      if (!parsed) {
        const allMatches = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        if (allMatches && allMatches.length > 0) {
          try {
            parsed = JSON.parse(allMatches[allMatches.length - 1]);
          } catch (e) {
            console.warn("Last JSON object parse failed:", e);
          }
        }
      }

      if (!parsed) {
        console.error("No valid JSON found in response:", text);

        // フォールバック: デフォルト値を返す
        return {
          difficulty: "intermediate",
          complexity: 5,
          estimatedTime: 90,
          reasoning: "分析データが不完全でした",
        };
      }

      console.log("Parsed analysis result:", parsed);
      return parsed;
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("画像の解析に失敗しました。");
    }
  }

  async generateStepsFromAnalysis(
    material: Material,
    _analysisResult: ImageAnalysisResponse
  ): Promise<StepGenerationResponse> {
    try {
      const materialPrompts = {
        // TODO: 今後追加予定の画材
        // pencil: {
        //   name: "デッサン（鉛筆）",
        //   steps: ["下書き", "輪郭線", "基本陰影", "詳細陰影", "仕上げ"],
        //   techniques: ["線の強弱", "陰影表現", "立体感", "質感表現"],
        // },
        // watercolor: {
        //   name: "水彩画",
        //   steps: [
        //     "下書き",
        //     "薄塗り（第一層）",
        //     "中間色（第二層）",
        //     "濃い色（第三層）",
        //     "仕上げ",
        //   ],
        //   techniques: [
        //     "水分コントロール",
        //     "グラデーション",
        //     "色の重ね",
        //     "乾燥タイミング",
        //   ],
        // },
        // "colored-pencil": {
        //   name: "色鉛筆",
        //   steps: ["下書き", "基本色塗り", "色の重ね", "細部描写", "仕上げ"],
        //   techniques: ["重ね塗り", "色の混合", "圧力調整", "質感表現"],
        // },
        acrylic: {
          name: "アクリル絵の具",
          steps: [
            "下書き",
            "基本色（明るい色）",
            "中間色",
            "暗い色・陰影",
            "仕上げ",
          ],
          techniques: ["厚塗り", "色の混合", "テクスチャ", "乾燥の速さ活用"],
        },
      };

      const materialInfo =
        materialPrompts[material as keyof typeof materialPrompts] ||
        materialPrompts.acrylic;

      // プロンプト最適化: 150文字以内に制限
      const prompt = `${materialInfo.name}手順をJSONで:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "名前",
      "description": "説明",
      "tips": ["コツ"],
      "estimatedDuration": 分,
      "techniques": ["技法"]
    }
  ]
}
5ステップ以内`;

      const result = await this.model.generateContent(prompt);

      const response = await result.response;
      const text = response.text();

      console.log("Steps generation raw response:", text);

      // JSONレスポンスをパース（複数のパターンを試行）
      let parsed = null;

      // パターン1: 標準的なJSON形式
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn("Standard JSON parse failed:", e);
        }
      }

      // パターン2: コードブロック内のJSON
      if (!parsed) {
        const codeBlockMatch = text.match(
          /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
        );
        if (codeBlockMatch) {
          try {
            parsed = JSON.parse(codeBlockMatch[1]);
          } catch (e) {
            console.warn("Code block JSON parse failed:", e);
          }
        }
      }

      if (!parsed) {
        console.error("No valid JSON found in steps response:", text);

        // フォールバック: デフォルト手順を返す
        return {
          steps: [
            {
              stepNumber: 1,
              title: "下書き",
              description: "基本的な形を描きます",
              tips: ["軽いタッチで"],
              estimatedDuration: 15,
              techniques: ["基本線"],
            },
            {
              stepNumber: 2,
              title: "基本色塗り",
              description: "基本となる色を塗ります",
              tips: ["薄めから始める"],
              estimatedDuration: 30,
              techniques: ["基本塗り"],
            },
            {
              stepNumber: 3,
              title: "仕上げ",
              description: "細部を調整します",
              tips: ["全体のバランスを確認"],
              estimatedDuration: 20,
              techniques: ["細部調整"],
            },
          ],
          totalEstimatedTime: 65,
        };
      }

      console.log("Parsed steps result:", parsed);
      return parsed;
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("手順の生成に失敗しました。");
    }
  }
}
