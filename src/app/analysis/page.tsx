"use client";
import Image from "next/image";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Star, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { ImageAnalysisResponse } from "@/types/analysis";
import { Material } from "@/types/tutorial";
import { ApiResponse } from "@/types/api";

function AnalysisPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analysisResult, setAnalysisResult] =
    useState<ImageAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const imageUrl = searchParams.get("image");
  const material = searchParams.get("material") as Material;

  const performAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          material,
        }),
      });

      const data: ApiResponse<ImageAnalysisResponse> = await response.json();

      if (data.success && data.data) {
        setAnalysisResult(data.data);
      } else {
        setError(data.error?.message || "解析に失敗しました。");
      }
    } catch {
      setError("ネットワークエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  }, [imageUrl, material]);

  useEffect(() => {
    if (!imageUrl || !material) {
      router.push("/");
      return;
    }

    performAnalysis();
  }, [imageUrl, material, performAnalysis, router]);

  const handleRetry = () => {
    performAnalysis();
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  const handleProceedToTutorial = () => {
    if (analysisResult && imageUrl && material) {
      // セッションストレージに保存
      const tutorialData = {
        imageUrl,
        material,
        analysisResult,
      };
      sessionStorage.setItem(
        "artorial_tutorial_data",
        JSON.stringify(tutorialData)
      );

      // チュートリアルページに遷移
      router.push("/tutorial");
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels = {
      beginner: "初級",
      intermediate: "中級",
      advanced: "上級",
    };
    return labels[difficulty as keyof typeof labels] || difficulty;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: "text-green-600 bg-green-100",
      intermediate: "text-yellow-600 bg-yellow-100",
      advanced: "text-red-600 bg-red-100",
    };
    return (
      colors[difficulty as keyof typeof colors] || "text-gray-600 bg-gray-100"
    );
  };

  const materialNames = {
    // TODO: 今後追加予定の画材
    // pencil: "デッサン",
    // watercolor: "水彩画",
    // "colored-pencil": "色鉛筆",
    acrylic: "アクリル絵の具",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            AI で画像を解析中...
          </h2>
          <p className="text-gray-600 mb-4">
            画像の複雑さと難易度を分析しています
          </p>
          <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <div
              className="bg-blue-600 h-2 rounded-full animate-pulse"
              style={{ width: "60%" }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            通常30秒ほどかかります...
          </p>
        </div>
      </div>
    );
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
            解析に失敗しました
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              再試行
            </button>
            <button
              onClick={handleBackToHome}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              最初に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">解析結果</h1>
          <p className="text-gray-600">
            AI が画像を解析し、{materialNames[material]}
            での描画難易度を判定しました
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 画像表示 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              選択された画像
            </h2>
            <div className="relative w-full max-w-md mx-auto">
              <Image
                src={imageUrl || ""}
                alt="解析対象の画像"
                width={400}
                height={300}
                className="w-full rounded-lg shadow-md"
              />
            </div>
            <div className="mt-4 text-center">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {materialNames[material]}
              </span>
            </div>
          </div>

          {/* 解析結果 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              解析結果
            </h2>

            {/* 難易度 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">難易度</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                    analysisResult.difficulty
                  )}`}
                >
                  {getDifficultyLabel(analysisResult.difficulty)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {analysisResult.reasoning}
              </div>
            </div>

            {/* 複雑さ */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">複雑さ</span>
                <div className="flex items-center">
                  {[...Array(10)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < analysisResult.complexity
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {analysisResult.complexity}/10
                  </span>
                </div>
              </div>
            </div>

            {/* 推定時間 */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">推定時間</span>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{analysisResult.estimatedTime}分</span>
                </div>
              </div>
            </div>

            {/* 被写体 */}
            <div className="mb-6">
              <div className="mb-2">
                <span className="text-gray-700">主な被写体</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysisResult.subjects.map((subject, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            {/* 信頼度 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">解析精度</span>
                <span className="text-gray-600">
                  {Math.round(analysisResult.confidence * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analysisResult.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handleBackToHome}
            className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            他の画像を選ぶ
          </button>
          <button
            onClick={handleProceedToTutorial}
            className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            手順を表示する
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <AnalysisPageContent />
    </Suspense>
  );
}
