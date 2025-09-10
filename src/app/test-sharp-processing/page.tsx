"use client";

import { useState } from "react";
import { Upload, Download, Loader2 } from "lucide-react";

interface ProcessingResults {
  lineArt: string;
  flat: string;
  shaded: string;
}

export default function TestProcessingPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<ProcessingResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "処理に失敗しました");
      }

      setResults(data.results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "不明なエラーが発生しました"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            画像処理テスト
          </h1>
          <p className="text-gray-600">
            線画・ベタ塗り・陰影付きの3段階画像処理をテストします
          </p>
        </div>

        {/* ファイルアップロード */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="mb-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500 font-medium">
                  ファイルを選択
                </span>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            {selectedFile && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  選択されたファイル: {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  サイズ: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
            <button
              onClick={processImage}
              disabled={!selectedFile || isProcessing}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center mx-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  処理中...
                </>
              ) : (
                "画像を処理"
              )}
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 結果表示 */}
        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">処理結果</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 線画 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">線画</h3>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={results.lineArt}
                    alt="線画"
                    className="w-full h-auto"
                  />
                </div>
                <button
                  onClick={() => downloadImage(results.lineArt, "lineArt.png")}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  ダウンロード
                </button>
              </div>

              {/* ベタ塗り */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">ベタ塗り</h3>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={results.flat}
                    alt="ベタ塗り"
                    className="w-full h-auto"
                  />
                </div>
                <button
                  onClick={() => downloadImage(results.flat, "flat.png")}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  ダウンロード
                </button>
              </div>

              {/* 陰影付き */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">陰影付き</h3>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={results.shaded}
                    alt="陰影付き"
                    className="w-full h-auto"
                  />
                </div>
                <button
                  onClick={() => downloadImage(results.shaded, "shaded.png")}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  ダウンロード
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 使い方説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">使い方</h3>
          <ul className="text-blue-800 space-y-2">
            <li>• 画像ファイル（JPG, PNG等）を選択してください</li>
            <li>
              • 「画像を処理」ボタンをクリックすると、3段階の処理が実行されます
            </li>
            <li>
              • <strong>線画</strong>: エッジ検出により白地に黒線の線画を生成
            </li>
            <li>
              • <strong>ベタ塗り</strong>: ブラー＋減色により平坦な色面を生成
            </li>
            <li>
              • <strong>陰影付き</strong>: ベタ塗りに影・ハイライトを合成
            </li>
            <li>• 各結果画像は個別にダウンロード可能です</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
