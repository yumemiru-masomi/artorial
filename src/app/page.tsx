"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Material } from "@/types/tutorial";

export default function Home() {
  const router = useRouter();
  const { processFile, isProcessing, error, reset } = useImageUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [textureStrength] = useState<number>(40);
  const [currentStep] = useState<"upload" | "analysis">("upload");

  const handleImageSelect = async (file: File) => {
    reset();
    const processedFile = await processFile(file);
    if (processedFile) {
      setSelectedFile(processedFile);
      setSelectedMaterial("acrylic"); // アクリル絵の具を自動選択
    }
  };

  const handleImageRemove = () => {
    setSelectedFile(null);
    setSelectedMaterial(null);
    reset();
  };

  const handleStartAnalysis = () => {
    if (selectedFile && selectedMaterial) {
      // ファイルをsessionStorageに一時保存（Base64形式）
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          sessionStorage.setItem("selectedFile", reader.result as string);
          sessionStorage.setItem("selectedMaterial", selectedMaterial);
          sessionStorage.setItem("textureStrength", textureStrength.toString());
          router.push("/analysis");
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Artorial</h1>
          <p className="text-xl text-gray-600 mb-2">AI絵画指導アプリ</p>
          <p className="text-gray-500">
            写真をアップロードして、AIが段階的な描画手順を生成します
          </p>
        </div>

        {/* 進捗インジケーター */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center ${
                currentStep === "upload"
                  ? "text-blue-600"
                  : selectedFile
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  currentStep === "upload"
                    ? "bg-blue-600"
                    : selectedFile
                    ? "bg-green-600"
                    : "bg-gray-400"
                }`}
              >
                1
              </div>
              <span className="ml-2 font-medium">画像アップロード</span>
            </div>
            <div
              className={`w-8 h-0.5 ${
                selectedFile ? "bg-green-600" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`flex items-center ${
                currentStep === "analysis" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  currentStep === "analysis" ? "bg-blue-600" : "bg-gray-400"
                }`}
              >
                2
              </div>
              <span className="ml-2 font-medium">AI解析</span>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {currentStep === "upload" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                選択された画像
              </h2>
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                isProcessing={isProcessing}
                error={error || undefined}
              />
              {selectedFile && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleStartAnalysis}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    解析開始
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
