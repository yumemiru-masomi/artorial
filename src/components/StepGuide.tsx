"use client";

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  CheckCircle,
  Loader2,
  Palette,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { GeneratedStep } from "@/types/analysis";
import { Material } from "@/types/tutorial";
import { ColorPalette as ColorPaletteType } from "@/types/color-palette";
import Image from "next/image";
import ColorPalette from "./ColorPalette";

interface StepGuideProps {
  step: GeneratedStep;
  currentStepNumber: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  colorPalette?: ColorPaletteType;
  originalImageUrl: string;
  material: Material;
  isFirstStep: boolean;
  isLastStep: boolean;
  allSteps: GeneratedStep[]; // 全ステップの情報
}

export default function StepGuide({
  step,
  currentStepNumber,
  totalSteps,
  onPrevious,
  onNext,
  colorPalette,
  originalImageUrl,
  material,
  isFirstStep,
  isLastStep,
  allSteps,
}: StepGuideProps) {
  const [stepImages, setStepImages] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextStepReady, setNextStepReady] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  // 画像生成進捗表示を削除

  // ステップ画像を生成する関数
  const generateStepImage = useCallback(
    async (stepIndex: number): Promise<string | null> => {
      try {
        const targetStep = allSteps[stepIndex];
        if (!targetStep) return null;

        // 生成状態をコンソールログのみに

        const response = await fetch("/api/generate-step-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            originalImageUrl,
            stepNumber: stepIndex + 1,
            stepDescription: targetStep.description,
            material,
            previousStepImageUrl: stepImages[stepIndex - 1] || null,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          // 生成完了をコンソールログのみに
          return data.data.imageUrl;
        } else {
          throw new Error(data.error?.message || "Failed to generate image");
        }
      } catch (error) {
        console.error(`Error generating step ${stepIndex + 1} image:`, error);
        // エラー状態をコンソールログのみに
        return null;
      }
    },
    [allSteps, originalImageUrl, material, stepImages]
  );

  // 現在のステップの画像のみを生成する関数（コスト削減）
  const generateCurrentStepImageOnly = useCallback(async () => {
    const currentIndex = currentStepNumber - 1;

    // 既に生成済みの場合はスキップ
    if (stepImages[currentIndex]) {
      console.log(
        `✅ ステップ${currentIndex + 1}の画像は既に生成済み - スキップ`
      );
      return;
    }

    console.log(`📸 ステップ${currentIndex + 1}の画像を生成中...`);

    try {
      setLoading(true);
      const currentImageUrl = await generateStepImage(currentIndex);

      if (currentImageUrl) {
        setStepImages((prev) => {
          const newArray = [...prev];
          newArray[currentIndex] = currentImageUrl;
          return newArray;
        });
        console.log(`✅ ステップ${currentIndex + 1}の画像生成完了`);
      } else {
        console.warn(`⚠️ ステップ${currentIndex + 1}の画像生成に失敗`);
      }
    } catch (error) {
      console.error(`❌ ステップ${currentIndex + 1}の画像生成エラー:`, error);
    } finally {
      setLoading(false);
    }
  }, [currentStepNumber, stepImages, generateStepImage]);

  // 初回ロード時に現在のステップの画像のみ生成（コスト削減）
  useEffect(() => {
    const currentIndex = currentStepNumber - 1;

    // 既に画像がある場合はスキップ
    if (stepImages[currentIndex]) {
      setNextStepReady(true);
      return;
    }

    // 現在のステップの画像のみ生成
    generateCurrentStepImageOnly();
  }, [currentStepNumber, originalImageUrl, material]);

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

  // 現在のステップの画像を取得
  const getCurrentStepImage = () => {
    const currentIndex = currentStepNumber - 1;
    return stepImages[currentIndex] || originalImageUrl;
  };

  // 生成進捗表示を削除

  return (
    <>
      <div className="max-w-6xl mx-auto px-4">
        {/* 進捗バー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              ステップ {currentStepNumber} / {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStepNumber / totalSteps) * 100)}% 完了
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
            ></div>
          </div>

          {/* 画像生成進捗表示を削除 */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 画像セクション */}
          <div className="space-y-6">
            {/* ステップ画像セクション */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  ステップ {currentStepNumber}: {step.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowColorPalette(!showColorPalette)}
                    className={`p-2 rounded-lg transition-colors ${
                      showColorPalette
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    title={
                      showColorPalette
                        ? "カラーパレットを非表示"
                        : "カラーパレットを表示"
                    }
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="animate-spin h-12 w-12 mx-auto text-blue-600 mb-4" />
                      <p className="text-gray-500 text-sm">画像生成中...</p>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={getCurrentStepImage()}
                    alt={`ステップ${currentStepNumber}: ${step.title}`}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
              </div>

              {/* カラーパレット */}
              {showColorPalette && colorPalette && (
                <div className="mt-6">
                  <ColorPalette palette={colorPalette} material={material} />
                </div>
              )}
            </div>
          </div>

          {/* 手順セクション */}
          <div className="space-y-6">
            {/* ステップ詳細 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-600 rounded-full p-2 mr-3">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {step.title}
                </h2>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">
                  {step.description}
                </p>
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
                    <Lightbulb className="w-4 h-4 text-yellow-500 mr-2" />
                    <h3 className="font-semibold text-gray-900">
                      コツとアドバイス
                    </h3>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <ul className="space-y-2">
                      {step.tips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 mr-3"></span>
                          <span className="text-sm text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 使用技法 */}
              {step.techniques && step.techniques.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">使用技法</h3>
                  <div className="flex flex-wrap gap-2">
                    {step.techniques.map((technique, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {technique}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md"
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            前のステップ
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              ステップ {currentStepNumber} / {totalSteps}
            </p>
          </div>

          <button
            onClick={handleNext}
            disabled={!nextStepReady}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              !nextStepReady
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105"
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
