"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StepGuide from "@/components/StepGuide";
import { useTutorial } from "@/hooks/useTutorial";
import StepGenerationLoadingWalkthrough from "@/components/StepGenerationLoadingWalkthrough";
import {
  StepGenerationResponse,
  ImageAnalysisResponse,
} from "@/types/analysis";
import { Material } from "@/types/tutorial";
import { ApiResponse } from "@/types/api";

interface TutorialData {
  imageUrl: string;
  material: Material;
  analysisResult: ImageAnalysisResponse;
}

function TutorialPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tutorialData, setTutorialData] = useState<TutorialData | null>(null);
  const [stepsData, setStepsData] = useState<StepGenerationResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const {
    currentStep,
    goToNextStep,
    goToPreviousStep,
    isFirstStep,
    isLastStep,
  } = useTutorial(stepsData?.steps.length || 0);

  useEffect(() => {
    // セッションストレージからデータを取得
    const fileData = sessionStorage.getItem("selectedFile");
    const materialData = sessionStorage.getItem("selectedMaterial");
    const analysisResultData = sessionStorage.getItem("analysisResult");

    if (!fileData || !materialData || !analysisResultData) {
      router.push("/");
      return;
    }

    try {
      const analysisResult: ImageAnalysisResponse =
        JSON.parse(analysisResultData);
      const data: TutorialData = {
        imageUrl: fileData, // Base64 data URL
        material: materialData as Material,
        analysisResult,
      };
      setTutorialData(data);
      generateSteps(data);
    } catch (error) {
      console.error(
        "Failed to parse tutorial data from session storage:",
        error
      );
      router.push("/");
    }
  }, [router, searchParams]);

  const generateSteps = async (data: TutorialData) => {
    setIsLoading(true);
    setError(null);

    try {
      // セッションストレージから画像ファイルを取得
      const fileData = sessionStorage.getItem("selectedFile");
      if (!fileData) {
        setError("画像ファイルが見つかりません。");
        return;
      }

      // Base64からBlobに変換
      const response = await fetch(fileData);
      const blob = await response.blob();
      const file = new File([blob], "image.jpg", { type: blob.type });

      // FormDataを作成
      const formData = new FormData();
      formData.append("file", file);
      formData.append("material", data.material);
      formData.append("analysisResult", JSON.stringify(data.analysisResult));

      const apiResponse = await fetch("/api/generate-steps", {
        method: "POST",
        body: formData,
      });

      const result: ApiResponse<StepGenerationResponse> =
        await apiResponse.json();

      if (result.success && result.data) {
        setStepsData(result.data);
        // 画像生成はStepGuideコンポーネントで必要時に実行（コスト削減）
      } else {
        setError(result.error?.message || "手順の生成に失敗しました。");
      }
    } catch {
      setError("ネットワークエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (tutorialData) {
      generateSteps(tutorialData);
    }
  };

  const handleNextStep = () => {
    if (isLastStep && stepsData) {
      setIsCompleted(true);
    } else {
      goToNextStep();
    }
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  const materialNames = {
    acrylic: "アクリル絵の具",
  };

  if (isLoading) {
    return <StepGenerationLoadingWalkthrough />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-red-100 rounded-full">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            手順生成に失敗しました
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted && stepsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-lg text-center">
          <h2 className="text-3xl font-bold header-text mb-4">
            おめでとうございます！
          </h2>
          <p className="text-xl header-text opacity-90 mb-2">
            アクリル絵の具の絵が完成しました
          </p>

          <div className="parchment-card rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              完了した内容
            </h3>
            <div className="text-left space-y-2">
              {stepsData.steps.map((step, index) => (
                <div key={index} className="flex items-center text-gray-700">
                  <svg
                    className="w-4 h-4 mr-2 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-900">{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-x-4">
            <button
              onClick={handleBackToHome}
              className="px-8 py-3 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
            >
              新しい画像で始める
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stepsData || !stepsData.steps.length) {
    return null;
  }

  const currentStepData = stepsData.steps[currentStep - 1];

  return (
    <div className="py-8">
      {/* ページタイトル */}
      <div className="mb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold header-text">絵を描く手順</h2>
            <div className="text-sm header-text opacity-80">
              推定時間: {stepsData.totalEstimatedTime}分
            </div>
          </div>
        </div>
      </div>

      {/* ステップガイド */}
      {tutorialData && (
        <StepGuide
          step={currentStepData}
          currentStepNumber={currentStep}
          totalSteps={stepsData.steps.length}
          onPrevious={goToPreviousStep}
          onNext={handleNextStep}
          originalImageUrl={tutorialData.imageUrl}
          material={tutorialData.material}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          allSteps={stepsData.steps}
          category={tutorialData.analysisResult.category}
          dominantColors={tutorialData.analysisResult.dominantColors}
          stepColors={tutorialData.analysisResult.stepColors}
        />
      )}
    </div>
  );
}

export default function TutorialPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <TutorialPageContent />
    </Suspense>
  );
}
