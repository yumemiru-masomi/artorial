"use client";

import { useState } from "react";
import { Upload, Download, Loader2, Sparkles, Cpu } from "lucide-react";
import Image from "next/image";

interface ProcessingResults {
  lineArt: string | null;
  flat: string | null;
  shaded: string | null;
}

type ProcessingMethod = "sharp" | "gemini";
type ProcessingStep = "lineArt" | "flat" | "shaded";

export default function TestProcessingPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<ProcessingResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<ProcessingMethod>("sharp");
  const [selectedProcessingType, setSelectedProcessingType] =
    useState<ProcessingStep | null>(null);
  const [showProcessingOptions, setShowProcessingOptions] = useState(false);

  // 段階的生成用の状態
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("lineArt");
  const [stepResults, setStepResults] = useState<{
    [key in ProcessingStep]: string | null;
  }>({
    lineArt: null,
    flat: null,
    shaded: null,
  });

  // 線画データを保持するための状態
  const [lineArtBlob, setLineArtBlob] = useState<Blob | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResults(null);
      setError(null);
      // 段階的生成の状態もリセット
      setCurrentStep("lineArt");
      setStepResults({
        lineArt: null,
        flat: null,
        shaded: null,
      });
      setShowProcessingOptions(false);
      setSelectedProcessingType(null);
      setLineArtBlob(null);
    }
  };

  // Base64からBlobに変換するヘルパー関数
  const dataURLToBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
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

      // ベタ塗りの場合で線画データがある場合、線画も送信
      if (step === "flat" && lineArtBlob) {
        formData.append("lineArt", lineArtBlob, "lineArt.png");
      }

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

        // 線画が生成された場合、Blobとして保存
        if (step === "lineArt") {
          const blob = dataURLToBlob(data.image);
          setLineArtBlob(blob);
        }
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

  // 段階的画像生成関数
  const generateStepImage = async (step: ProcessingStep) => {
    if (!selectedFile) return;

    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("step", step);

      // ベタ塗りの場合で線画データがある場合、線画も送信
      if (step === "flat" && lineArtBlob) {
        formData.append("lineArt", lineArtBlob, "lineArt.png");
      }

      const response = await fetch("/api/gemini-process-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.image) {
        // 結果を更新
        setStepResults((prev) => ({
          ...prev,
          [step]: data.image,
        }));

        // 線画が生成された場合、Blobとして保存
        if (step === "lineArt") {
          const blob = dataURLToBlob(data.image);
          setLineArtBlob(blob);
        }

        // 次のステップの準備
        if (step === "lineArt") {
          // バックグラウンドでベタ塗りを生成開始
          setTimeout(() => generateStepImage("flat"), 500);
        } else if (step === "flat") {
          // ベタ塗りが完成したら次のステップ準備完了
          setCurrentStep("flat");
          // バックグラウンドで陰影付きを生成開始
          setTimeout(() => generateStepImage("shaded"), 500);
        } else if (step === "shaded") {
          setCurrentStep("shaded");
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "処理中にエラーが発生しました"
      );
    } finally {
      // 処理完了
    }
  };

  const processImage = async () => {
    if (!selectedFile) return;

    if (method === "gemini") {
      // Geminiの場合は段階的生成を開始
      setIsProcessing(true);
      setError(null);
      setCurrentStep("lineArt");

      // 線画生成を開始
      await generateStepImage("lineArt");
      setIsProcessing(false);
      return;
    }

    // Sharp処理の場合は従来通り
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.results) {
        setResults(data.results);
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

        {/* 処理方法選択 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">処理方法を選択</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setMethod("sharp")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                method === "sharp"
                  ? "bg-blue-600 text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
              }`}
            >
              <Cpu className="h-5 w-5" />
              <span>Sharp処理</span>
            </button>
            <button
              onClick={() => {
                setMethod("gemini");
                setShowProcessingOptions(true);
                setSelectedProcessingType(null);
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                method === "gemini"
                  ? "bg-purple-600 text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
              }`}
            >
              <Sparkles className="h-5 w-5" />
              <span>Gemini Vision</span>
            </button>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-medium">
              {method === "sharp" ? "📊 従来の画像処理" : "🤖 AI画像生成"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {method === "sharp"
                ? "Sharp + image-q による高速処理・3スタイル対応"
                : "gemini-2.5-flash-image-preview・線画のみ対応"}
            </p>
          </div>
        </div>

        {/* Gemini処理タイプ選択 */}
        {method === "gemini" && showProcessingOptions && (
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
        )}

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
              if (method === "gemini" && selectedProcessingType) {
                generateSingleImage(selectedProcessingType);
              } else if (method === "sharp") {
                processImage();
              }
            }}
            disabled={
              !selectedFile ||
              isProcessing ||
              (method === "gemini" && !selectedProcessingType)
            }
            className={`px-8 py-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 mx-auto ${
              selectedFile &&
              !isProcessing &&
              (method === "sharp" || selectedProcessingType)
                ? method === "gemini"
                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>
                  {method === "gemini" ? "AI画像生成中..." : "画像処理中..."}
                </span>
              </>
            ) : method === "gemini" ? (
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
            ) : (
              <>
                <Cpu className="h-5 w-5" />
                <span>画像を処理</span>
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

        {/* Gemini個別生成結果表示 */}
        {method === "gemini" &&
          (stepResults.lineArt || stepResults.flat || stepResults.shaded) && (
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

        {/* Sharp処理結果表示 */}
        {method === "sharp" && results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Cpu className="h-5 w-5 mr-2 text-blue-600" />
              画像処理結果
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 線画 */}
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4 text-gray-800">線画</h3>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden min-h-[300px] flex items-center justify-center bg-gray-50">
                  {results.lineArt ? (
                    <Image
                      src={results.lineArt}
                      alt="線画"
                      width={400}
                      height={300}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-2">
                        <svg
                          className="w-12 h-12 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">
                        生成されませんでした
                      </p>
                    </div>
                  )}
                </div>
                {results.lineArt && (
                  <button
                    onClick={() =>
                      downloadImage(results.lineArt, "lineArt.png")
                    }
                    className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center w-full transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ダウンロード
                  </button>
                )}
              </div>

              {/* ベタ塗り */}
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4 text-gray-800">
                  ベタ塗り
                </h3>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden min-h-[300px] flex items-center justify-center bg-gray-50">
                  {results.flat ? (
                    <Image
                      src={results.flat}
                      alt="ベタ塗り"
                      width={400}
                      height={300}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-2">
                        <svg
                          className="w-12 h-12 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">
                        処理されませんでした
                      </p>
                    </div>
                  )}
                </div>
                {results.flat && (
                  <button
                    onClick={() => downloadImage(results.flat, "flat.png")}
                    className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center w-full transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ダウンロード
                  </button>
                )}
              </div>

              {/* 陰影付き */}
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4 text-gray-800">
                  陰影付き
                </h3>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden min-h-[300px] flex items-center justify-center bg-gray-50">
                  {results.shaded ? (
                    <Image
                      src={results.shaded}
                      alt="陰影付き"
                      width={400}
                      height={300}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-2">
                        <svg
                          className="w-12 h-12 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">
                        処理されませんでした
                      </p>
                    </div>
                  )}
                </div>
                {results.shaded && (
                  <button
                    onClick={() => downloadImage(results.shaded, "shaded.png")}
                    className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center w-full transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ダウンロード
                  </button>
                )}
              </div>
            </div>

            {/* 処理情報 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>処理方法: Sharp + image-q</span>
                <span>ファイル: {selectedFile?.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
