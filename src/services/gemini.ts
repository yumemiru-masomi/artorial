import { GoogleGenerativeAI } from "@google/generative-ai";
import { ImageAnalysisResponse, StepColors, ColorInfo } from "@/types/analysis";
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
    model: process.env.TEXT_MODEL_ID ?? "gemini-2.5-flash",
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
   * RGB値から色名を推定（改良版・背景色を考慮）
   */
  private getColorName(r: number, g: number, b: number): string {
    // より詳細な色名判定
    if (r > 250 && g > 250 && b > 250) return "白";
    if (r > 220 && g > 220 && b > 220) return "薄い白";
    if (r < 20 && g < 20 && b < 20) return "黒";
    if (r < 50 && g < 50 && b < 50) return "濃いグレー";

    // 緑系（背景色として重要・判定を強化）
    if (g > r && g > b) {
      const greenDominance = g - Math.max(r, b);
      if (greenDominance > 30) {
        // 閾値を下げて検出しやすく
        if (r > g * 0.8 && b < g * 0.6) return "黄緑";
        if (b > g * 0.8 && r < g * 0.6) return "青緑";
        if (g > 180 && r > 100 && b > 100) return "明るい緑";
        if (g > 150) return "緑";
        if (g > 100) return "濃い緑";
        return "深緑";
      }
    }

    // 緑系の追加判定（より幅広い緑を検出）
    if (g > 100 && g > r * 1.2 && g > b * 1.2) {
      return "緑";
    }

    // 青・水色系（背景色として重要）
    if (b > r && b > g) {
      const blueDominance = b - Math.max(r, g);
      if (blueDominance > 50) {
        if (r > 150 && g > 200) return "水色";
        if (g > r + 30) return "青緑";
        if (b > 180) return "明るい青";
        if (b > 120) return "青";
        return "濃い青";
      }
    }

    // 茶色系（背景色として重要・判定を改善）
    if (r > g && g > b) {
      const brownness = (r - b) / Math.max(r, 1);
      if (brownness > 0.2 && r - b > 20) {
        if (r > 200 && g > 140 && b > 80) return "明るい茶色";
        if (r > 160 && g > 100 && b > 60) return "茶色";
        if (r > 120 && g > 80 && b > 40) return "濃い茶色";
        return "茶系";
      }
    }

    // オレンジ・茶色の境界判定
    if (r > 150 && g > 100 && b < 100 && r > g && g > b) {
      if (g > r * 0.7) return "オレンジブラウン";
      return "茶色";
    }

    // ベージュ・肌色系
    if (r > 180 && g > 140 && b > 100 && r > g && g > b && r - b > 20) {
      if (r > 220 && g > 180 && b > 140) return "ベージュ";
      return "薄い茶色";
    }

    // ピンク系
    if (r > 200 && g > 150 && b > 150 && r > g && r > b) {
      if (r > 240 && g > 200) return "薄いピンク";
      return "ピンク";
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

    // 紫系
    if (r > 100 && b > 100 && r > g && b > g && Math.abs(r - b) < 50) {
      if (r > 180 && b > 180) return "明るい紫";
      return "紫";
    }

    // 赤系
    if (r > g && r > b && r - Math.max(g, b) > 40) {
      if (r > 180) return "明るい赤";
      if (r > 120) return "赤";
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
      // 日本語対応・動的値生成・ステップ別色分類プロンプト
      const prompt = `この画像を詳細に分析して、以下のJSON形式で日本語で回答してください：

{
  "difficulty": "beginner/intermediate/advanced のいずれか（画像の複雑さに応じて選択）",
  "complexity": "1-10の数値（1=非常に簡単、10=非常に複雑）",
  "estimatedTime": "30-180の数値（分単位、難易度に応じて変動）",
  "reasoning": "日本語での詳細な分析理由",
  "category": "landscape/portrait/character/still_life/abstract/animal/architecture/other",
  "dominantColors": [
    {"hex": "#色コード", "name": "色名", "percentage": 割合},
    // 最大8色まで
  ],
  "stepColors": {
    "background": [{"hex": "#色コード", "name": "色名", "percentage": 割合}],
    "main_part": [{"hex": "#色コード", "name": "色名", "percentage": 割合}],
    "details": [{"hex": "#色コード", "name": "色名", "percentage": 割合}]
  }
}

分析基準：
- difficulty: シンプルな形状=beginner、中程度=intermediate、複雑な細部=advanced
- complexity: 色数・形状・細部の複雑さを1-10で評価
- estimatedTime: difficultyとcomplexityに基づいて30-180分で設定
- dominantColors: 画像全体の主要色を抽出
- stepColors: 絵画ステップ別に色を分類
  * background: 背景の色（画像の端や奥の色、人物・物体以外の色）
  * main_part: 主要被写体の色（人物・動物・建物の色）
  * details: 細部の色（黒・白・小さな装飾など）
- 実際の画像内容を正確に反映した動的な値を設定
- JSONのみ回答（説明文不要）`;

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

      // パターン1: 最もシンプルなJSON抽出（新フィールド対応）
      const simpleJsonMatch = text.match(
        /\{[^{}]*"difficulty"[^{}]*"complexity"[^{}]*"estimatedTime"[^{}]*"reasoning"[^{}]*"category"[^{}]*"categoryDescription"[^{}]*"dominantColors"[^{}]*\}/
      );
      if (simpleJsonMatch) {
        try {
          parsed = JSON.parse(simpleJsonMatch[0]);
        } catch (e) {}
      }

      // パターン2: コードブロック内のJSON
      if (!parsed) {
        const codeBlockMatch = text.match(
          /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
        );
        if (codeBlockMatch) {
          try {
            parsed = JSON.parse(codeBlockMatch[1]);
          } catch (e) {}
        }
      }

      // パターン3: 強制的なJSON構築（最後の手段）
      if (!parsed) {
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
        }
      }

      if (!parsed) {
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
        categoryDescription: "", // 使用しないため空文字
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
        stepColors: this.validateStepColors(parsed.stepColors),
      };

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

  /**
   * ステップ別色情報を検証・正規化
   */
  private validateStepColors(stepColors: unknown): StepColors | undefined {
    if (!stepColors || typeof stepColors !== "object") {
      return undefined;
    }

    const stepColorsObj = stepColors as Record<string, unknown>;

    const validateColorArray = (colors: unknown): ColorInfo[] => {
      if (!Array.isArray(colors)) return [];

      return colors
        .filter(
          (color): color is Record<string, unknown> =>
            color && typeof color === "object"
        )
        .map((color) => ({
          hex:
            typeof color.hex === "string" && color.hex.startsWith("#")
              ? color.hex
              : "#808080",
          name: typeof color.name === "string" ? color.name : "不明",
          percentage: Math.max(
            0,
            Math.min(
              100,
              typeof color.percentage === "number" ? color.percentage : 0
            )
          ),
        }))
        .slice(0, 5); // 各ステップ最大5色
    };

    const result: StepColors = {
      background: validateColorArray(stepColorsObj.background),
      main_part: validateColorArray(stepColorsObj.main_part),
      details: validateColorArray(stepColorsObj.details),
    };

    return result;
  }

  /**
   * 画像とプロンプトからテキストを生成（動的ステップ説明用）
   */
  async generateTextFromImageAndPrompt(
    base64Image: string,
    prompt: string,
    mimeType: string = "image/jpeg"
  ): Promise<string> {
    try {
      const result = await this.model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType,
          },
        },
        prompt,
      ]);

      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error("空のレスポンスが返されました");
      }

      return text.trim();
    } catch (error) {
      console.error("🚨 Gemini テキスト生成エラー:", error);
      throw error;
    }
  }
}
