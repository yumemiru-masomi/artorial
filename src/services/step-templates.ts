/**
 * ステップテンプレート
 * カテゴリ別に事前定義された描画ステップテンプレートを提供
 */

import { GeneratedStep, ImageCategory } from "@/types/analysis";

// キャラクター画用の固定ステップ
const CHARACTER_STEPS: GeneratedStep[] = [
  {
    stepNumber: 1,
    title: "下書き・線画",
    description:
      "アップロード画像の形状と比率を保持したまま、白い背景に黒い線だけの線画に変換します。",
    stepType: "lineart",
    tips: [
      "下書きを印刷し、キャンバスのトレーシングペーパーを敷いて、その上に印刷した用紙を置いて鉛筆でなぞる",
    ],
    estimatedDuration: 15,
    techniques: ["線画", "輪郭描写"],
  },
  {
    stepNumber: 2,
    title: "背景塗り",
    description:
      "背景全体を元画像と同じ色で塗ります。キャラクター部分は白黒線画のまま残します。",
    stepType: "background",
    tips: ["元画像の背景を詳細に観察", "キャラクター部分は塗らない"],
    estimatedDuration: 25,
    techniques: ["背景塗り", "色観察", "境界認識"],
  },
  {
    stepNumber: 3,
    title: "主要部分塗り",
    description:
      "キャラクターの肌・服・髪など主要な部分を元画像と同じ色で塗り分けます。",
    stepType: "main_part",
    tips: ["色を正確に観察して再現", "部位ごとに丁寧に塗り分ける"],
    estimatedDuration: 35,
    techniques: ["基本塗り", "色分け塗り", "細部塗り"],
  },
  {
    stepNumber: 4,
    title: "細部・仕上げ",
    description:
      "画像にある要素（目・口・鼻・眉毛など）の細部をブラックで描き込み、ハイライトを白で加えて全体を仕上げます。",
    stepType: "details",
    tips: ["細い筆を使用", "全体のバランスを確認しながら調整"],
    estimatedDuration: 25,
    techniques: ["細部描写", "ハイライト", "仕上げ"],
  },
];

// 風景画用の固定ステップ
const LANDSCAPE_STEPS: GeneratedStep[] = [
  {
    stepNumber: 1,
    title: "下書き・線画",
    description:
      "アップロード画像の形状と比率を保持したまま、白い背景に黒い線だけの線画に変換します。",
    stepType: "lineart",
    tips: ["線の太さを均一にする"],
    estimatedDuration: 15,
    techniques: ["線画", "輪郭描写"],
  },
  {
    stepNumber: 2,
    title: "背景塗り",
    description:
      "空や遠景など背景部分を元画像と同じ色で塗ります。前景は白黒線画のまま残します。",
    stepType: "background",
    tips: ["空の色を正確に再現", "前景は塗らない"],
    estimatedDuration: 25,
    techniques: ["背景塗り", "グラデーション"],
  },
  {
    stepNumber: 3,
    title: "主要部分塗り",
    description: "山・木・建物など主要な要素を元画像と同じ色で塗ります。",
    stepType: "main_part",
    tips: ["自然な色を再現", "遠近感を意識"],
    estimatedDuration: 30,
    techniques: ["基本塗り", "色分け塗り"],
  },
  {
    stepNumber: 4,
    title: "細部・仕上げ",
    description:
      "葉っぱ・雲・水面などの細部を描き込み、全体の質感を仕上げます。",
    stepType: "details",
    tips: ["質感を意識", "全体のバランス確認"],
    estimatedDuration: 20,
    techniques: ["細部描写", "質感表現", "仕上げ"],
  },
];

// 静物画用の固定ステップ
const STILL_LIFE_STEPS: GeneratedStep[] = [
  {
    stepNumber: 1,
    title: "下書き・線画",
    description:
      "アップロード画像の形状と比率を保持したまま、白い背景に黒い線だけの線画に変換します。",
    stepType: "lineart",
    tips: ["線の太さを均一にする"],
    estimatedDuration: 15,
    techniques: ["線画", "輪郭描写"],
  },
  {
    stepNumber: 2,
    title: "背景塗り",
    description:
      "背景部分を元画像と同じ色で塗ります。オブジェクトは白黒線画のまま残します。",
    stepType: "background",
    tips: ["背景色を正確に再現", "オブジェクトは塗らない"],
    estimatedDuration: 20,
    techniques: ["背景塗り", "平塗り"],
  },
  {
    stepNumber: 3,
    title: "主要部分塗り",
    description: "メインのオブジェクトや建物を元画像と同じ色で塗ります。",
    stepType: "main_part",
    tips: ["質感を意識", "色を正確に観察"],
    estimatedDuration: 30,
    techniques: ["基本塗り", "質感表現"],
  },
  {
    stepNumber: 4,
    title: "細部・仕上げ",
    description: "影・ハイライト・細かな装飾などを描き込み、全体を仕上げます。",
    stepType: "details",
    tips: ["立体感を意識", "全体のバランス確認"],
    estimatedDuration: 25,
    techniques: ["細部描写", "陰影表現", "仕上げ"],
  },
];

// 抽象画・その他用の固定ステップ
const ABSTRACT_STEPS: GeneratedStep[] = [
  {
    stepNumber: 1,
    title: "下書き・線画",
    description:
      "アップロード画像の形状と比率を保持したまま、白い背景に黒い線だけの線画に変換します。",
    stepType: "lineart",
    tips: ["線の太さを均一にする"],
    estimatedDuration: 15,
    techniques: ["線画", "輪郭描写"],
  },
  {
    stepNumber: 2,
    title: "背景塗り",
    description:
      "背景部分を元画像と同じ色で塗ります。主要要素は白黒線画のまま残します。",
    stepType: "background",
    tips: ["色の調和を意識", "主要要素は塗らない"],
    estimatedDuration: 20,
    techniques: ["背景塗り", "色彩表現"],
  },
  {
    stepNumber: 3,
    title: "主要部分塗り",
    description: "主要な形や要素を元画像と同じ色で塗ります。",
    stepType: "main_part",
    tips: ["色の対比を活用", "バランスを意識"],
    estimatedDuration: 25,
    techniques: ["基本塗り", "色彩表現"],
  },
  {
    stepNumber: 4,
    title: "細部・仕上げ",
    description: "細かな要素や効果を加えて全体を仕上げます。",
    stepType: "details",
    tips: ["全体の統一感を確認", "必要に応じて調整"],
    estimatedDuration: 20,
    techniques: ["細部描写", "効果表現", "仕上げ"],
  },
];

/**
 * カテゴリに基づいてステップテンプレートを取得
 */
export function getStepTemplates(category: ImageCategory): GeneratedStep[] {
  switch (category) {
    case "portrait":
    case "character":
    case "animal":
      return CHARACTER_STEPS;

    case "landscape":
      return LANDSCAPE_STEPS;

    case "still_life":
    case "architecture":
      return STILL_LIFE_STEPS;

    case "abstract":
    case "other":
    default:
      return ABSTRACT_STEPS;
  }
}

/**
 * ステップテンプレートの総時間を計算
 */
export function calculateTotalTime(steps: GeneratedStep[]): number {
  return steps.reduce((total, step) => total + step.estimatedDuration, 0);
}
