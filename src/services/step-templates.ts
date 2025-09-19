import { Material } from "@/types/tutorial";
import { GeneratedStep } from "@/types/analysis";

// 画材別の固定ステップテンプレート
export const STEP_TEMPLATES: Record<Material, GeneratedStep[]> = {
  acrylic: [
    {
      stepNumber: 1,
      title: "下書き・線画",
      description: "基本的な形と構図を軽く描きます",
      tips: ["薄めの線で", "消しやすい鉛筆使用"],
      estimatedDuration: 15,
      techniques: ["基本線画", "構図確認"],
    },
    {
      stepNumber: 2,
      title: "基本色塗り",
      description: "メインとなる色を大まかに塗ります",
      tips: ["薄めから始める", "大きな面から"],
      estimatedDuration: 25,
      techniques: ["基本塗り", "色分け"],
    },
    {
      stepNumber: 3,
      title: "中間色・グラデーション",
      description: "色の境界をなじませ、立体感を出します",
      tips: ["乾く前に混色", "筆圧調整"],
      estimatedDuration: 20,
      techniques: ["グラデーション", "色の混合"],
    },
    {
      stepNumber: 4,
      title: "影・陰影",
      description: "暗い部分を描き込み、立体感を強化します",
      tips: ["光源を意識", "段階的に濃く"],
      estimatedDuration: 20,
      techniques: ["陰影表現", "立体感"],
    },
    {
      stepNumber: 5,
      title: "ハイライト・仕上げ",
      description: "明るい部分と細部を仕上げます",
      tips: ["最後に白を追加", "全体のバランス確認"],
      estimatedDuration: 15,
      techniques: ["ハイライト", "細部調整"],
    },
  ],
};

// 難易度に応じたステップ調整
export function adjustStepsForDifficulty(
  baseSteps: GeneratedStep[],
  difficulty: "beginner" | "intermediate" | "advanced",
  complexity: number
): GeneratedStep[] {
  const adjustedSteps = baseSteps.map((step) => ({ ...step }));

  switch (difficulty) {
    case "beginner":
      // 簡単な作品: 時間短縮、シンプルなコツ
      adjustedSteps.forEach((step) => {
        step.estimatedDuration = Math.max(
          5,
          Math.floor(step.estimatedDuration * 0.7)
        );
        step.tips = step.tips.slice(0, 1); // コツを1つに絞る
      });
      break;

    case "advanced":
      // 複雑な作品: 時間延長、詳細なコツ追加
      adjustedSteps.forEach((step) => {
        step.estimatedDuration = Math.floor(step.estimatedDuration * 1.5);
        if (step.tips.length < 2) {
          step.tips.push("慎重に進める");
        }
      });
      break;

    case "intermediate":
    default:
      // 標準のまま
      break;
  }

  // 複雑さに応じた時間調整
  const complexityMultiplier = 0.8 + complexity * 0.04; // 0.8 - 1.2
  adjustedSteps.forEach((step) => {
    step.estimatedDuration = Math.floor(
      step.estimatedDuration * complexityMultiplier
    );
  });

  return adjustedSteps;
}
