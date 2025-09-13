"use client";

import { useState } from "react";
import { Upload, Download, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";

type ProcessingStep = "lineArt" | "flat" | "shaded";

export default function TestProcessingPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProcessingType, setSelectedProcessingType] =
    useState<ProcessingStep | null>(null);

  // 段階的生成用の状態
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("lineArt");
  const [stepResults, setStepResults] = useState<{
    [key in ProcessingStep]: string | null;
  }>({
    lineArt: null,
    flat: null,
    shaded: null,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      // 段階的生成の状態もリセット
      setCurrentStep("lineArt");
      setStepResults({
        lineArt: null,
        flat: null,
        shaded: null,
      });
      setSelectedProcessingType(null);
    }
  };

  // 個別画像生成関数
  const generateSingleImage = async (step: ProcessingStep) => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("step", step);

      const response = await fetch("/api/gemini-process-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.image) {
        // 結果を表示用にセット
        setStepResults({
          lineArt: step === "lineArt" ? data.image : null,
          flat: step === "flat" ? data.image : null,
          shaded: step === "shaded" ? data.image : null,
        });
        setCurrentStep(step);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "処理中にエラーが発生しました"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (imageData: string | null, filename: string) => {
    if (!imageData) return;

    const link = document.createElement("a");
    link.href = imageData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">画像処理テスト</h1>

        {/* 処理タイプ選択 */}
        {
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">処理タイプを選択</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedProcessingType("lineArt")}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedProcessingType === "lineArt"
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">✏️</div>
                  <h3 className="font-medium">線画</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    シンプルな線画に変換
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelectedProcessingType("flat")}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedProcessingType === "flat"
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎨</div>
                  <h3 className="font-medium">ベタ塗り</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    単色塗りのアニメ風に変換
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelectedProcessingType("shaded")}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedProcessingType === "shaded"
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">✨</div>
                  <h3 className="font-medium">ハイライト・シャドー</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    陰影付きの完全版に変換
                  </p>
                </div>
              </button>
            </div>
          </div>
        }

        {/* ファイルアップロード */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            画像をアップロード
          </h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              <span className="text-lg text-gray-600 font-medium">
                クリックして画像を選択
              </span>
              <span className="text-sm text-gray-400 mt-2">
                PNG, JPG, JPEG対応
              </span>
              {selectedFile && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm text-green-700 font-medium">
                    ✓ 選択済み: {selectedFile.name}
                  </span>
                  <span className="text-xs text-green-600 block mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* 処理ボタン */}
        <div className="text-center mb-8">
          <button
            onClick={() => {
              if (selectedProcessingType) {
                generateSingleImage(selectedProcessingType);
              }
            }}
            disabled={!selectedFile || isProcessing || !selectedProcessingType}
            className={`px-8 py-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 mx-auto ${
              selectedFile && !isProcessing && selectedProcessingType
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>AI画像生成中...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>
                  {selectedProcessingType
                    ? `${
                        selectedProcessingType === "lineArt"
                          ? "線画"
                          : selectedProcessingType === "flat"
                          ? "ベタ塗り"
                          : "ハイライト・シャドー"
                      }を生成`
                    : "処理タイプを選択してください"}
                </span>
              </>
            )}
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  エラーが発生しました
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI画像生成結果表示 */}
        {(stepResults.lineArt || stepResults.flat || stepResults.shaded) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
              AI画像生成結果 -{" "}
              {currentStep === "lineArt"
                ? "線画"
                : currentStep === "flat"
                ? "ベタ塗り"
                : "ハイライト・シャドー"}
            </h2>

            {/* 中央に現在のステップの画像を表示 */}
            <div className="text-center">
              <div className="inline-block border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 mb-6">
                {stepResults[currentStep] ? (
                  <Image
                    src={stepResults[currentStep]!}
                    alt={
                      currentStep === "lineArt"
                        ? "線画"
                        : currentStep === "flat"
                        ? "ベタ塗り"
                        : "ハイライト・シャドー"
                    }
                    width={400}
                    height={400}
                    className="max-w-full max-h-96 w-auto h-auto"
                  />
                ) : (
                  <div className="w-96 h-96 flex items-center justify-center">
                    <div className="text-center py-12">
                      <Loader2 className="animate-spin h-12 w-12 mx-auto text-purple-600 mb-4" />
                      <p className="text-gray-500 text-sm">生成中...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ダウンロードボタン */}
              {stepResults[currentStep] && (
                <button
                  onClick={() =>
                    downloadImage(
                      stepResults[currentStep],
                      `${
                        currentStep === "lineArt"
                          ? "lineArt"
                          : currentStep === "flat"
                          ? "flat"
                          : "shaded"
                      }.png`
                    )
                  }
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium flex items-center justify-center mx-auto transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  ダウンロード
                </button>
              )}
            </div>

            {/* 処理情報 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>処理方法: Gemini 2.5 Flash Image Preview</span>
                <span>ファイル: {selectedFile?.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
