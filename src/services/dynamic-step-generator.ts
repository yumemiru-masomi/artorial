/**
 * 動的ステップ説明生成サービス
 * Geminiを使用して画像に特化したステップ説明を生成
 */

import { GeminiService } from "./gemini";
import { GeneratedStep, ImageAnalysisResponse } from "@/types/analysis";

export class DynamicStepGenerator {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * 画像解析結果とステップテンプレートを基に、
   * 画像に特化した詳細なステップ説明を生成
   */
  async generateDynamicDescriptions(
    steps: GeneratedStep[],
    analysisResult: ImageAnalysisResponse,
    base64Image: string
  ): Promise<GeneratedStep[]> {
    const enhancedSteps = await Promise.all(
      steps.map(async (step, index) => {
        try {
          const dynamicDescription = await this.generateStepDescription(
            step,
            analysisResult,
            base64Image,
            index + 1
          );

          return {
            ...step,
            description: dynamicDescription || step.description, // フォールバック
          };
        } catch (error) {
          return step; // 元の説明を使用
        }
      })
    );

    return enhancedSteps;
  }

  /**
   * 個別ステップの詳細説明を生成
   */
  private async generateStepDescription(
    step: GeneratedStep,
    analysisResult: ImageAnalysisResponse,
    base64Image: string,
    stepNumber: number
  ): Promise<string> {
    const prompt = this.buildStepDescriptionPrompt(
      step,
      analysisResult,
      stepNumber
    );

    try {
      // Geminiで画像を見ながらステップ説明を生成
      const response = await this.geminiService.generateTextFromImageAndPrompt(
        base64Image,
        prompt
      );

      return this.validateAndCleanDescription(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * ステップ説明生成用プロンプトを構築
   */
  private buildStepDescriptionPrompt(
    step: GeneratedStep,
    analysisResult: ImageAnalysisResponse,
    stepNumber: number
  ): string {
    const categoryContext = this.getCategoryContext(analysisResult.category);
    const colorContext = this.getColorContext(analysisResult.dominantColors);

    return `この画像を見て、アクリル絵の具での描画ステップ${stepNumber}「${step.title}」の詳細な説明を日本語で生成してください。

【画像情報】
- カテゴリ: ${analysisResult.category}
- 難易度: ${analysisResult.difficulty}
- 主要色: ${colorContext}

【ステップ情報】
- タイトル: ${step.title}
- タイプ: ${step.stepType}
- 基本説明: ${step.description}

【生成要件】
1. この画像の具体的な特徴を観察して説明に反映
2. ${categoryContext}の特徴を考慮
3. アクリル絵の具での描画に特化した指示
4. 初心者にも分かりやすい具体的な手順
5. 2-3文で簡潔にまとめる
6. **重要**: 説明文は300文字以内で収める

【出力形式】
画像の具体的な要素を含んだ詳細な説明文のみを出力してください（300文字以内）。`;
  }

  /**
   * カテゴリ別のコンテキスト情報を取得
   */
  private getCategoryContext(category: string): string {
    const contexts: Record<string, string> = {
      portrait: "人物画",
      character: "キャラクター画",
      landscape: "風景画",
      still_life: "静物画",
      animal: "動物画",
      architecture: "建築画",
      abstract: "抽象画",
      other: "一般的な絵画",
    };

    return contexts[category] || "一般的な絵画";
  }

  /**
   * 主要色の情報を文字列として整理
   */
  private getColorContext(
    colors: Array<{ hex: string; name: string }>
  ): string {
    return colors
      .slice(0, 5)
      .map((color) => `${color.name}(${color.hex})`)
      .join("、");
  }

  /**
   * 生成された説明文を検証・クリーニング
   */
  private validateAndCleanDescription(description: string): string {
    if (!description || description.trim().length === 0) {
      throw new Error("空の説明文が生成されました");
    }

    // 不要な文字や改行を除去
    let cleaned = description
      .trim()
      .replace(/^["']|["']$/g, "") // 引用符を除去
      .replace(/\n+/g, " ") // 改行をスペースに変換
      .replace(/\s+/g, " "); // 連続するスペースを単一に

    // 長すぎる場合は切り詰め
    if (cleaned.length > 200) {
      cleaned = cleaned.substring(0, 200) + "...";
    }

    return cleaned;
  }
}

/**
 * シングルトンインスタンス
 */
export const dynamicStepGenerator = new DynamicStepGenerator();
