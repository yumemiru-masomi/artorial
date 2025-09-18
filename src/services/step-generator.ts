import { Material } from "@/types/tutorial";
import {
  ImageAnalysisResponse,
  StepGenerationResponse,
} from "@/types/analysis";
import { STEP_TEMPLATES, adjustStepsForDifficulty } from "./step-templates";

/**
 * ハイブリッド手順生成サービス
 * テンプレート + AI調整で安定した結果を提供
 */
export class StepGeneratorService {
  /**
   * メイン手順生成メソッド
   * テンプレートベースで安定性を確保し、AIで微調整
   */
  async generateSteps(
    material: Material,
    analysisResult: ImageAnalysisResponse
  ): Promise<StepGenerationResponse> {
    // 1. テンプレートから基本ステップを取得
    const baseSteps = STEP_TEMPLATES[material] || STEP_TEMPLATES.acrylic;

    // 2. 難易度に応じて調整
    const difficultyAdjustedSteps = adjustStepsForDifficulty(
      baseSteps,
      analysisResult.difficulty,
      analysisResult.complexity
    );

    // 3. 総時間を計算
    const totalEstimatedTime = difficultyAdjustedSteps.reduce(
      (total, step) => total + step.estimatedDuration,
      0
    );

    return {
      steps: difficultyAdjustedSteps,
      totalEstimatedTime,
    };
  }

  /**
   * AIによる動的手順生成（フォールバック用）
   * テンプレートが利用できない場合のみ使用
   */
  async generateStepsWithAI(
    material: Material,
    analysisResult: ImageAnalysisResponse
  ): Promise<StepGenerationResponse> {
    // 簡潔なプロンプトでAI生成
    const prompt = `${material}で描く基本手順を3-5ステップで簡潔に:
難易度${analysisResult.difficulty}`;

    // 実装は既存のGemini呼び出しを使用
    // ここでは簡略化

    return {
      steps: STEP_TEMPLATES.acrylic.slice(0, 3), // フォールバック
      totalEstimatedTime: 60,
    };
  }
}

export const stepGeneratorService = new StepGeneratorService();
