"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import OnboardingWalkthrough from "@/components/OnboardingWalkthrough";
import MaterialsListModal from "@/components/MaterialsListModal";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Material } from "@/types/tutorial";

export default function Home() {
  const router = useRouter();
  const { processFile, isProcessing, error, reset } = useImageUpload();
  const { isOnboardingCompleted, isLoading, completeOnboarding } =
    useOnboarding();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [textureStrength] = useState<number>(40);
  const [currentStep] = useState<"upload" | "analysis">("upload");
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);

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

  const handleStartAnalysis = async () => {
    if (selectedFile && selectedMaterial) {
      try {
        // 型安全なセッション管理を使用
        const { saveImageAnalysisSession } = await import(
          "@/lib/session-storage"
        );
        await saveImageAnalysisSession(
          selectedFile,
          selectedMaterial,
          textureStrength
        );
        router.push("/analysis");
      } catch (error) {
        console.error("Failed to save session data:", error);
        // エラー時はフォールバック処理を実行
        alert("データの保存に失敗しました。再試行してください。");
      }
    }
  };

  // ローディング中は何も表示しない
  if (isLoading) {
    return null;
  }

  // オンボーディングが完了していない場合はウォークスルーを表示
  if (!isOnboardingCompleted) {
    return <OnboardingWalkthrough onComplete={completeOnboarding} />;
  }

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 説明文 */}
        <div className="text-center mb-12">
          <p className="header-text text-lg">好きな時に、好きな絵を描こう </p>
        </div>

        {/* 必要なものリストボタン */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowMaterialsModal(true)}
            className="px-6 py-3 bg-sage-light text-white rounded-lg font-medium hover:bg-sage transition-colors shadow-lg"
          >
            絵を描く時に必要なものリスト
          </button>
        </div>

        {/* メインコンテンツ */}
        <div className="parchment-card rounded-lg p-8">
          {currentStep === "upload" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                描きたい画像を選択してください。
              </h2>
              <p className="text-sm text-black text-center mb-4">
                人物・キャラクター・動物画を推奨します
              </p>
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                isProcessing={isProcessing}
                error={error || undefined}
              />
              {selectedFile && (
                <div className="mt-6 flex justify-center space-x-4">
                  <button
                    onClick={handleImageRemove}
                    className="px-6 py-3 bg-white bg-opacity-20 text-gray-400 rounded-lg font-medium hover:bg-white hover:bg-opacity-30 transition-colors backdrop-blur-sm border border-white border-opacity-30"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleStartAnalysis}
                    className="px-8 py-3 bg-sage-light text-white rounded-lg font-medium hover:bg-sage-light transition-colors"
                  >
                    解析開始
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 必要なものリストモーダル */}
      <MaterialsListModal
        isOpen={showMaterialsModal}
        onClose={() => setShowMaterialsModal(false)}
      />
    </div>
  );
}
