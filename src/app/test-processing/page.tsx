"use client";

import { useState } from "react";
import { Upload, Download, Loader2, Sparkles, Cpu } from "lucide-react";

interface ProcessingResults {
  lineArt: string | null;
  flat: string | null;
  shaded: string | null;
}

type ProcessingMethod = "sharp" | "gemini";

export default function TestProcessingPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<ProcessingResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<ProcessingMethod>("sharp");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResults(null);
      setError(null);
    }
  };

  const processImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const endpoint =
        method === "gemini"
          ? "/api/gemini-process-image"
          : "/api/process-image";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (method === "gemini" && data.results) {
          setResults(data.results);
        } else if (method === "sharp" && data.results) {
          setResults(data.results);
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
              onClick={() => setMethod("gemini")}
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
            onClick={processImage}
            disabled={!selectedFile || isProcessing}
            className={`px-8 py-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 mx-auto ${
              selectedFile && !isProcessing
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
                <span>AIで画像生成</span>
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

        {/* 結果表示 */}
        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              {method === "gemini" ? (
                <>
                  <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                  AI画像生成結果
                </>
              ) : (
                <>
                  <Cpu className="h-5 w-5 mr-2 text-blue-600" />
                  画像処理結果
                </>
              )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 線画 */}
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4 text-gray-800">線画</h3>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden min-h-[300px] flex items-center justify-center bg-gray-50">
                  {results.lineArt ? (
                    <img
                      src={results.lineArt}
                      alt="線画"
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
                        {method === "gemini"
                          ? "生成されませんでした"
                          : "処理されませんでした"}
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
                    <img
                      src={results.flat}
                      alt="ベタ塗り"
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
                        {method === "gemini"
                          ? "線画のみ対応"
                          : "処理されませんでした"}
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
                    <img
                      src={results.shaded}
                      alt="陰影付き"
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
                        {method === "gemini"
                          ? "線画のみ対応"
                          : "処理されませんでした"}
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
                <span>
                  処理方法:{" "}
                  {method === "gemini"
                    ? "Gemini 2.5 Flash Image Preview"
                    : "Sharp + image-q"}
                </span>
                <span>ファイル: {selectedFile?.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
