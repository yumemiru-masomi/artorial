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
import { useState, useEffect } from "react";
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
  const [generationProgress, setGenerationProgress] = useState<{
    [key: number]: "pending" | "generating" | "completed" | "error";
  }>({});
  const [totalStepsToGenerate, setTotalStepsToGenerate] = useState(0);

  // ステップ画像を生成する関数
  async function generateStepImage(stepIndex: number): Promise<string | null> {
    try {
      const targetStep = allSteps[stepIndex];
      if (!targetStep) return null;

      // 生成状態を更新
      setGenerationProgress((prev) => ({
        ...prev,
        [stepIndex]: "generating",
      }));

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
        // 生成完了状態を更新
        setGenerationProgress((prev) => ({
          ...prev,
          [stepIndex]: "completed",
        }));
        return data.data.imageUrl;
      } else {
        throw new Error(data.error?.message || "Failed to generate image");
      }
    } catch (error) {
      console.error(`Error generating step ${stepIndex + 1} image:`, error);
      // エラー状態を更新
      setGenerationProgress((prev) => ({
        ...prev,
        [stepIndex]: "error",
      }));
      return null;
    }
  }

  // 全ステップの画像を順次生成する関数
  async function generateAllStepImages() {
    console.log(`🚀 全${allSteps.length}ステップの画像生成を開始`);
    setTotalStepsToGenerate(allSteps.length);

    // 初期状態を設定
    const initialProgress: {
      [key: number]: "pending" | "generating" | "completed" | "error";
    } = {};
    allSteps.forEach((_, index) => {
      initialProgress[index] = "pending";
    });
    setGenerationProgress(initialProgress);

    // 現在のステップから開始して、順次生成
    const currentIndex = currentStepNumber - 1;

    try {
      // 1. まず現在のステップの画像を生成
      setLoading(true);
      const currentImageUrl = await generateStepImage(currentIndex);
      if (currentImageUrl) {
        setStepImages((prev) => {
          const newArray = [...prev];
          newArray[currentIndex] = currentImageUrl;
          return newArray;
        });
      }
      setLoading(false);

      // 2. 残りの全ステップを並列で生成（現在のステップ以外）
      const remainingSteps = allSteps
        .map((_, index) => index)
        .filter((index) => index !== currentIndex);

      // 並列生成のPromise配列を作成
      const generationPromises = remainingSteps.map(async (stepIndex) => {
        const imageUrl = await generateStepImage(stepIndex);
        if (imageUrl) {
          setStepImages((prev) => {
            const newArray = [...prev];
            newArray[stepIndex] = imageUrl;
            return newArray;
          });
        }
        return { stepIndex, imageUrl };
      });

      // 全ての生成を並列実行
      const results = await Promise.allSettled(generationPromises);

      // 結果をログ出力
      results.forEach((result, index) => {
        const stepIndex = remainingSteps[index];
        if (result.status === "fulfilled") {
          console.log(`✅ ステップ${stepIndex + 1}の画像生成完了`);
        } else {
          console.error(
            `❌ ステップ${stepIndex + 1}の画像生成失敗:`,
            result.reason
          );
        }
      });

      console.log(`🎉 全ステップの画像生成処理完了`);
      setNextStepReady(true);
    } catch (error) {
      console.error("❌ 全ステップ画像生成中にエラー:", error);
      setLoading(false);
    }
  }

  // 初回ロード時に全ステップの画像生成を開始
  useEffect(() => {
    const currentIndex = currentStepNumber - 1;

    // 既に画像がある場合はスキップ
    if (stepImages[currentIndex]) {
      setNextStepReady(true);
      return;
    }

    // 全ステップの画像生成を開始
    generateAllStepImages();
  }, [currentStepNumber, originalImageUrl, material]);

  // 生成進捗を監視して次へボタンの状態を更新
  useEffect(() => {
    const completedSteps = Object.values(generationProgress).filter(
      (status) => status === "completed"
    ).length;
    const totalSteps = Object.keys(generationProgress).length;

    if (totalSteps > 0 && completedSteps >= Math.min(2, totalSteps)) {
      // 最低2ステップ（現在+次）または全ステップが完了したら次へボタンを活性化
      setNextStepReady(true);
    }
  }, [generationProgress]);

  // 次へボタンのハンドラ
  const handleNext = () => {
    onNext();
    // 全ステップの画像生成は既に開始されているので、追加の処理は不要
  };

  // 現在のステップの画像を取得
  const getCurrentStepImage = () => {
    const currentIndex = currentStepNumber - 1;
    return stepImages[currentIndex] || originalImageUrl;
  };

  // 生成進捗の統計を取得
  const getGenerationStats = () => {
    const statuses = Object.values(generationProgress);
    return {
      total: statuses.length,
      completed: statuses.filter((s) => s === "completed").length,
      generating: statuses.filter((s) => s === "generating").length,
      pending: statuses.filter((s) => s === "pending").length,
      error: statuses.filter((s) => s === "error").length,
    };
  };

  return (
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

        {/* 画像生成進捗 */}
        {totalStepsToGenerate > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                🎨 画像生成進捗
              </span>
              <span className="text-sm text-gray-500">
                {getGenerationStats().completed} / {getGenerationStats().total}{" "}
                完了
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    getGenerationStats().total > 0
                      ? (getGenerationStats().completed /
                          getGenerationStats().total) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              {getGenerationStats().generating > 0 && (
                <div className="flex items-center">
                  <Loader2 className="animate-spin w-3 h-3 mr-1 text-blue-500" />
                  <span>生成中: {getGenerationStats().generating}</span>
                </div>
              )}
              {getGenerationStats().completed > 0 && (
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                  <span>完了: {getGenerationStats().completed}</span>
                </div>
              )}
              {getGenerationStats().error > 0 && (
                <div className="flex items-center">
                  <span className="w-3 h-3 mr-1 bg-red-500 rounded-full"></span>
                  <span>エラー: {getGenerationStats().error}</span>
                </div>
              )}
            </div>
          </div>
        )}
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
                <ColorPalette palette={colorPalette} />
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
              <h2 className="text-xl font-bold text-gray-900">{step.title}</h2>
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
          disabled={isLastStep || !nextStepReady}
          className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isLastStep || !nextStepReady
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105"
          }`}
        >
          {isLastStep ? (
            "完了"
          ) : !nextStepReady ? (
            <>
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
              {getGenerationStats().total > 0
                ? `画像生成中... (${getGenerationStats().completed}/${
                    getGenerationStats().total
                  })`
                : "画像生成中..."}
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
  );
}
