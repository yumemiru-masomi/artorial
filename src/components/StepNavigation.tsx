"use client";

import { useRouter } from "next/navigation";
import { SessionManager } from "@/services/session-manager";
import { ArrowLeft, Home } from "lucide-react";

interface StepNavigationProps {
  currentStep: number;
  stepName: string;
  canGoBack?: boolean;
}

export default function StepNavigation({
  currentStep,
  stepName,
  canGoBack = true,
}: StepNavigationProps) {
  const router = useRouter();

  const handleGoBackToStep = (targetStep: number) => {
    // セッション情報を確認
    const session = SessionManager.getSession();
    if (!session) {
      router.push("/");
      return;
    }

    // 指定されたステップに戻る
    SessionManager.goToStep(targetStep);

    // 各ステップに対応するページに遷移
    switch (targetStep) {
      case 1:
        router.push("/");
        break;
      case 2:
        router.push("/analysis");
        break;
      case 3:
        router.push("/tutorial");
        break;
      case 4:
        router.push("/line-drawing");
        break;
      case 5:
        router.push("/painting");
        break;
      default:
        router.push("/");
    }
  };

  const handleBackToHome = () => {
    // 確認ダイアログを表示
    const shouldRestart = confirm(
      "最初からやり直しますか？現在の進捗は失われます。"
    );
    
    if (shouldRestart) {
      SessionManager.clearSession();
      router.push("/");
    }
  };

  const stepLabels = [
    "画像アップロード",
    "AI解析", 
    "手順表示",
    "線画生成",
    "色付け"
  ];

  return (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* 進捗インジケーター */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2">
            {stepLabels.map((label, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              
              return (
                <div key={stepNumber} className="flex items-center">
                  <button
                    onClick={() => stepNumber < currentStep && handleGoBackToStep(stepNumber)}
                    disabled={stepNumber >= currentStep}
                    className={`flex items-center ${
                      stepNumber < currentStep
                        ? "cursor-pointer hover:opacity-80"
                        : "cursor-default"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        isCompleted
                          ? "bg-green-600"
                          : isCurrent
                          ? "bg-blue-600"
                          : "bg-gray-400"
                      }`}
                    >
                      {stepNumber}
                    </div>
                    <span
                      className={`ml-2 text-sm font-medium ${
                        isCompleted
                          ? "text-green-600"
                          : isCurrent
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                  {index < stepLabels.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-2 ${
                        isCompleted ? "bg-green-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {canGoBack && currentStep > 1 && (
              <button
                onClick={() => handleGoBackToStep(currentStep - 1)}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                前のステップ
              </button>
            )}
          </div>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">{stepName}</h2>
          </div>

          <button
            onClick={handleBackToHome}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            最初から
          </button>
        </div>
      </div>
    </div>
  );
}