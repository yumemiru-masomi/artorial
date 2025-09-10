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
  });

  async analyzeImage(
    imageUrl: string,
    material: Material
  ): Promise<ImageAnalysisResponse> {
    try {
      // 画像をBase64形式で読み込み
      const imageData = await this.getImageAsBase64(imageUrl);

      const materialNames = {
        pencil: "デッサン（鉛筆）",
        watercolor: "水彩画",
        "colored-pencil": "色鉛筆",
        acrylic: "アクリル絵の具",
      };

      const prompt = `
この画像を${materialNames[material]}で描く場合の分析を行ってください。

以下の形式でJSONレスポンスを返してください：
{
  "difficulty": "beginner" | "intermediate" | "advanced",
  "complexity": 1-10の数値,
  "subjects": ["主要な被写体のリスト"],
  "estimatedTime": 分単位の推定時間,
  "reasoning": "難易度判定の理由",
  "confidence": 0-1の信頼度
}

分析基準：
- beginner: 単純な形状、少ない色数、明確な輪郭
- intermediate: 中程度の複雑さ、複数の要素、適度な陰影
- advanced: 複雑な構造、微細なディテール、複雑な陰影や色彩

${materialNames[material]}での描画を想定して分析してください。
      `;

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData,
          },
        },
        prompt,
      ]);

      const response = await result.response;
      const text = response.text();

      // JSONレスポンスをパース
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("画像の解析に失敗しました。");
    }
  }

  async generateSteps(
    imageUrl: string,
    material: Material,
    analysisResult: ImageAnalysisResponse
  ): Promise<StepGenerationResponse> {
    try {
      const imageData = await this.getImageAsBase64(imageUrl);

      const materialPrompts = {
        pencil: {
          name: "デッサン（鉛筆）",
          steps: ["下書き", "輪郭線", "基本陰影", "詳細陰影", "仕上げ"],
          techniques: ["線の強弱", "陰影表現", "立体感", "質感表現"],
        },
        watercolor: {
          name: "水彩画",
          steps: [
            "下書き",
            "薄塗り（第一層）",
            "中間色（第二層）",
            "濃い色（第三層）",
            "仕上げ",
          ],
          techniques: [
            "水分コントロール",
            "グラデーション",
            "色の重ね",
            "乾燥タイミング",
          ],
        },
        "colored-pencil": {
          name: "色鉛筆",
          steps: ["下書き", "基本色塗り", "色の重ね", "細部描写", "仕上げ"],
          techniques: ["重ね塗り", "色の混合", "圧力調整", "質感表現"],
        },
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

      const materialInfo = materialPrompts[material];

      const prompt = `
この画像を${materialInfo.name}で描くための段階的な手順を生成してください。

画像の分析結果：
- 難易度: ${analysisResult.difficulty}
- 複雑さ: ${analysisResult.complexity}/10
- 被写体: ${analysisResult.subjects.join(", ")}

${materialInfo.name}の特徴的な手順：
${materialInfo.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

主要技法：
${materialInfo.techniques.join(", ")}

以下の形式でJSONレスポンスを返してください：
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "ステップタイトル",
      "description": "詳細な説明（200-300文字）",
      "tips": ["コツ1", "コツ2", "コツ3"],
      "estimatedDuration": 分単位の時間,
      "techniques": ["使用する技法"]
    }
  ],
  "totalEstimatedTime": 全体の推定時間（分）
}

各ステップで以下を含めてください：
- 具体的な描画手順
- ${materialInfo.name}特有の技法
- 初心者にも分かりやすい説明
- 実用的なコツとアドバイス
      `;

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData,
          },
        },
        prompt,
      ]);

      const response = await result.response;
      const text = response.text();

      // JSONレスポンスをパース
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("手順の生成に失敗しました。");
    }
  }

  private async getImageAsBase64(imageUrl: string): Promise<string> {
    try {
      // 本番環境では、画像URLから実際にデータを取得する必要があります
      // 開発環境では、サンプルデータを返すか、実装を簡略化できます

      if (imageUrl.startsWith("/uploads/")) {
        // ローカルファイルの場合
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "public", imageUrl);
        const buffer = await fs.readFile(filePath);
        return buffer.toString("base64");
      } else {
        // 外部URLの場合
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return buffer.toString("base64");
      }
    } catch (error) {
      console.error("Error reading image:", error);
      throw new Error("画像の読み込みに失敗しました。");
    }
  }
}
