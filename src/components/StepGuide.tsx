"use client";

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, memo } from "react";
import {
  GeneratedStep,
  ImageCategory,
  ColorInfo,
  StepColors,
} from "@/types/analysis";
import { Material } from "@/types/tutorial";
import Image from "next/image";
import { useStepImageGeneration } from "@/hooks/useStepImageGeneration";
import { getColorsForStep, getStepTypeLabel } from "@/lib/color-mapping";
import ColorPalette from "@/components/ColorPalette";
import ImagePrintOrganizer, {
  ImagePrintOrganizerProps,
} from "@/components/ImagePrintOrganizer";

interface StepGuideProps {
  step: GeneratedStep;
  currentStepNumber: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  originalImageUrl: string;
  material: Material;
  isFirstStep: boolean;
  isLastStep: boolean;
  allSteps: GeneratedStep[]; // 全ステップの情報
  category: ImageCategory; // 画像カテゴリ
  dominantColors?: ColorInfo[]; // 画像解析で取得した主要色
  stepColors?: StepColors; // Geminiが分類したステップ別の色
}

const StepGuide = memo(function StepGuide({
  step,
  currentStepNumber,
  totalSteps,
  onPrevious,
  onNext,
  originalImageUrl,
  material,
  isFirstStep,
  isLastStep,
  allSteps,
  category,
  dominantColors = [],
  stepColors,
}: StepGuideProps) {
  const [nextStepReady, setNextStepReady] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // 画像生成ロジックをカスタムフックに分離
  const {
    stepImages,
    loading,
    generateCurrentStepImage,
    getCurrentStepImage,
    regenerateStepImage,
  } = useStepImageGeneration({
    allSteps,
    originalImageUrl,
    material,
    category,
  });

  // 初回ロード時に現在のステップの画像のみ生成（コスト削減）
  useEffect(() => {
    const currentIndex = currentStepNumber - 1;

    // 既に画像がある場合はスキップ
    if (stepImages[currentIndex]) {
      setNextStepReady(true);
      return;
    }

    // 現在のステップの画像のみ生成
    generateCurrentStepImage(currentIndex);
  }, [currentStepNumber, stepImages, generateCurrentStepImage]);

  // 生成進捗を監視して次へボタンの状態を更新
  useEffect(() => {
    const currentIndex = currentStepNumber - 1;

    // 現在のステップの画像があるかチェック
    const currentStepReady =
      stepImages[currentIndex] !== null &&
      stepImages[currentIndex] !== undefined;

    // 現在のステップの画像があれば次へボタンを活性化
    // 最後のステップでは常に活性化（完了ボタン）
    if (currentStepReady || isLastStep) {
      setNextStepReady(true);
    } else {
      setNextStepReady(false);
    }
  }, [stepImages, currentStepNumber, isLastStep]);

  // 次へボタンのハンドラ
  const handleNext = () => {
    if (isLastStep) {
      // 最後のステップの場合、確認モーダルを表示
      setShowCompletionModal(true);
    } else {
      onNext();
      // 全ステップの画像生成は既に開始されているので、追加の処理は不要
    }
  };

  const handleCompletionConfirm = () => {
    setShowCompletionModal(false);
    onNext(); // 完了処理を実行
  };

  const handleCompletionCancel = () => {
    setShowCompletionModal(false);
  };

  // 現在のステップで使用する色を取得（Gemini分類を優先）
  const currentStepColors = getColorsForStep(
    step.stepType,
    dominantColors,
    stepColors
  );

  return (
    <>
      <div className="max-w-6xl mx-auto px-4">
        {/* 進捗バー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold header-text">
              ステップ {currentStepNumber} / {totalSteps}
            </span>
            <span className="text-sm font-medium header-text opacity-90">
              {Math.round((currentStepNumber / totalSteps) * 100)}% 完了
            </span>
          </div>
          <div className="w-full bg-white bg-opacity-30 rounded-full h-2 border border-white border-opacity-40">
            <div
              className="h-full rounded-full transition-all duration-500 shadow-sm border border-amber-700"
              style={{
                width: `${(currentStepNumber / totalSteps) * 100}%`,
                backgroundColor: "#B8860B",
              }}
            ></div>
          </div>

          {/* 画像生成進捗表示を削除 */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 画像セクション */}
          <div className="space-y-6">
            {/* ステップ画像セクション */}
            <div className="parchment-card rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  ステップ {currentStepNumber}: {step.title}
                </h3>
              </div>

              <div className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="animate-spin h-12 w-12 mx-auto text-sage mb-4" />
                      <p className="text-gray-500 text-sm">画像生成中...</p>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={getCurrentStepImage(currentStepNumber)}
                    alt={`ステップ${currentStepNumber}: ${step.title}`}
                    width={400}
                    height={400}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* 再生成ボタンを画像の直下に配置 */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => regenerateStepImage(currentStepNumber - 1)}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-sage-light hover:text-sage disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  {loading ? "生成中..." : "画像を再生成"}
                </button>
              </div>
            </div>
          </div>

          {/* 手順セクション */}
          <div className="space-y-6">
            {/* ステップ詳細 */}
            <div className="parchment-card rounded-lg p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {step.title}
                </h2>
              </div>

              <div className="mb-6">
                <div className="text-gray-700 leading-relaxed">
                  {step.description && step.description.length > 150 ? (
                    <>
                      <p className="whitespace-pre-line">
                        {isDescriptionExpanded
                          ? step.description
                          : `${step.description.substring(0, 150)}...`}
                      </p>
                      <button
                        onClick={() =>
                          setIsDescriptionExpanded(!isDescriptionExpanded)
                        }
                        className="mt-2 text-sage-light hover:text-sage underline text-sm font-medium"
                      >
                        {isDescriptionExpanded ? "閉じる" : "もっと見る"}
                      </button>
                    </>
                  ) : (
                    <p className="whitespace-pre-line">{step.description}</p>
                  )}
                </div>
              </div>

              {/* 推定時間 */}
              <div className="flex items-center text-sm text-gray-600 mb-6">
                <Clock className="w-4 h-4 mr-2" />
                <span>推定時間: {step.estimatedDuration}分</span>
              </div>

              {/* コツとアドバイス */}
              {step.tips && step.tips.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-600 mr-2" />
                    <h3 className="font-semibold text-gray-900">
                      コツとアドバイス
                    </h3>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <ul className="space-y-2">
                      {step.tips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span
                            className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 mr-3"
                            style={{ backgroundColor: "#B8860B" }}
                          ></span>
                          <span className="text-sm text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 印刷ボタンをコツとアドバイスの下に配置（下書き・線画のステップのみ） */}
              {step.stepType === "lineart" && (
                <div className="mt-6 flex justify-center">
                  <ImagePrintOrganizer
                    imageUrl={getCurrentStepImage(currentStepNumber)}
                    stepTitle={step.title}
                    stepNumber={currentStepNumber}
                    isImageReady={
                      !loading && stepImages[currentStepNumber - 1] !== null
                    }
                  />
                </div>
              )}
            </div>

            {/* ステップ専用カラーパレット */}
            {currentStepColors.length > 0 && (
              <div className="mt-6">
                <ColorPalette
                  colors={currentStepColors}
                  title={`${getStepTypeLabel(step.stepType)}で使用する色`}
                />
              </div>
            )}
          </div>
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={onPrevious}
            disabled={isFirstStep}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isFirstStep
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-sage text-white hover:bg-sage hover:shadow-md"
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            前のステップ
          </button>

          <div className="text-center">
            <p className="text-sm font-medium header-text">
              ステップ {currentStepNumber} / {totalSteps}
            </p>
          </div>

          <button
            onClick={handleNext}
            disabled={!nextStepReady}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              !nextStepReady
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-sage-light text-white hover:bg-sage-light hover:shadow-lg transform hover:scale-105"
            }`}
          >
            {isLastStep ? (
              "完了"
            ) : !nextStepReady ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                画像生成中...
              </>
            ) : (
              <>
                次のステップ
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 完了確認モーダル */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-gray-500/25 flex items-center justify-center z-50">
          <div className="parchment-card rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              手順完了の確認
            </h3>
            <p className="text-gray-600 mb-6">
              この手順はもう見られなくなりますが、大丈夫ですか？
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCompletionCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCompletionConfirm}
                className="px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default StepGuide;
