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

  // 他の画材も同様に定義...
  watercolor: [
    {
      stepNumber: 1,
      title: "薄い下書き",
      description: "水に溶けない薄い鉛筆で描きます",
      tips: ["HBか2H鉛筆使用", "極薄く"],
      estimatedDuration: 10,
      techniques: ["薄線画", "水彩準備"],
    },
    {
      stepNumber: 2,
      title: "薄塗り（第一層）",
      description: "薄めた絵具で全体の色調を決めます",
      tips: ["たっぷりの水で", "明るい色から"],
      estimatedDuration: 20,
      techniques: ["薄塗り", "ウェットオンドライ"],
    },
    {
      stepNumber: 3,
      title: "中間色（第二層）",
      description: "少し濃い色で形を明確にします",
      tips: ["第一層が乾いてから", "水分量調整"],
      estimatedDuration: 25,
      techniques: ["重ね塗り", "色の調整"],
    },
    {
      stepNumber: 4,
      title: "濃い色・陰影",
      description: "最も濃い色で陰影と細部を描きます",
      tips: ["水分少なめで", "筆先で細部"],
      estimatedDuration: 20,
      techniques: ["濃色塗り", "細部描写"],
    },
    {
      stepNumber: 5,
      title: "仕上げ・調整",
      description: "全体のバランスを整え、必要に応じて修正",
      tips: ["乾いた筆でぼかし", "白抜き確認"],
      estimatedDuration: 10,
      techniques: ["最終調整", "白抜き活用"],
    },
  ],

  pencil: [
    {
      stepNumber: 1,
      title: "軽い下書き",
      description: "基本的な形とプロポーションを描きます",
      tips: ["H系鉛筆で薄く", "大まかな形から"],
      estimatedDuration: 15,
      techniques: ["基本形状", "プロポーション"],
    },
    {
      stepNumber: 2,
      title: "輪郭線の確定",
      description: "主要な輪郭線をはっきりと描きます",
      tips: ["HBかB鉛筆使用", "線の強弱つける"],
      estimatedDuration: 20,
      techniques: ["輪郭線", "線の強弱"],
    },
    {
      stepNumber: 3,
      title: "基本陰影",
      description: "大まかな明暗を描き分けます",
      tips: ["B系鉛筆で", "面で考える"],
      estimatedDuration: 25,
      techniques: ["基本陰影", "面的塗り"],
    },
    {
      stepNumber: 4,
      title: "詳細陰影・質感",
      description: "細かい陰影と質感を描き込みます",
      tips: ["濃淡のメリハリ", "質感を意識"],
      estimatedDuration: 25,
      techniques: ["詳細陰影", "質感表現"],
    },
    {
      stepNumber: 5,
      title: "仕上げ・調整",
      description: "全体のバランスを整え、最終調整します",
      tips: ["練り消しで調整", "最暗部の確認"],
      estimatedDuration: 10,
      techniques: ["最終調整", "コントラスト"],
    },
  ],

  "colored-pencil": [
    {
      stepNumber: 1,
      title: "軽い下書き",
      description: "薄い色鉛筆で基本形を描きます",
      tips: ["明るい色で薄く", "消せる色鉛筆推奨"],
      estimatedDuration: 15,
      techniques: ["基本線画", "色鉛筆下書き"],
    },
    {
      stepNumber: 2,
      title: "基本色塗り",
      description: "主要な色を軽いタッチで塗ります",
      tips: ["軽い圧力で", "円運動で塗る"],
      estimatedDuration: 30,
      techniques: ["基本塗り", "軽圧塗り"],
    },
    {
      stepNumber: 3,
      title: "色の重ね塗り",
      description: "複数の色を重ねて深みを出します",
      tips: ["少しずつ重ねる", "色の相性確認"],
      estimatedDuration: 25,
      techniques: ["重ね塗り", "色の混合"],
    },
    {
      stepNumber: 4,
      title: "細部描写・質感",
      description: "細かい部分と質感を描き込みます",
      tips: ["鉛筆を立てて", "ハッチング技法"],
      estimatedDuration: 20,
      techniques: ["細部描写", "ハッチング"],
    },
    {
      stepNumber: 5,
      title: "仕上げ・統一感",
      description: "全体の統一感を出し、最終調整します",
      tips: ["全体を見直し", "色の調和確認"],
      estimatedDuration: 15,
      techniques: ["最終調整", "色彩調和"],
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
