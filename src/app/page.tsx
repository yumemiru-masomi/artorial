'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import MaterialSelector from '@/components/MaterialSelector';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Material } from '@/types/tutorial';

export default function Home() {
  const router = useRouter();
  const { uploadImage, isUploading, error, reset } = useImageUpload();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [textureStrength, setTextureStrength] = useState<number>(40);
  const [currentStep, setCurrentStep] = useState<'upload' | 'material' | 'analysis'>('upload');

  const handleImageSelect = async (file: File) => {
    reset();
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setUploadedImageUrl(imageUrl);
      setCurrentStep('material');
    }
  };

  const handleImageRemove = () => {
    setUploadedImageUrl(null);
    setSelectedMaterial(null);
    setCurrentStep('upload');
    reset();
  };

  const handleMaterialSelect = (material: Material) => {
    setSelectedMaterial(material);
  };

  const handleStartAnalysis = () => {
    if (uploadedImageUrl && selectedMaterial) {
      // 解析結果ページへ遷移（URLパラメータで画像とマテリアル情報を渡す）
      const params = new URLSearchParams({
        image: uploadedImageUrl,
        material: selectedMaterial,
        textureStrength: textureStrength.toString(),
      });
      router.push(`/analysis?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Artorial
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            AI絵画指導アプリ
          </p>
          <p className="text-gray-500">
            写真をアップロードして、AIが段階的な描画手順を生成します
          </p>
        </div>

        {/* 進捗インジケーター */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${currentStep === 'upload' ? 'text-blue-600' : uploadedImageUrl ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${currentStep === 'upload' ? 'bg-blue-600' : uploadedImageUrl ? 'bg-green-600' : 'bg-gray-400'}`}>
                1
              </div>
              <span className="ml-2 font-medium">画像アップロード</span>
            </div>
            <div className={`w-8 h-0.5 ${uploadedImageUrl ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'material' ? 'text-blue-600' : selectedMaterial ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${currentStep === 'material' ? 'bg-blue-600' : selectedMaterial ? 'bg-green-600' : 'bg-gray-400'}`}>
                2
              </div>
              <span className="ml-2 font-medium">画材選択</span>
            </div>
            <div className={`w-8 h-0.5 ${selectedMaterial ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'analysis' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${currentStep === 'analysis' ? 'bg-blue-600' : 'bg-gray-400'}`}>
                3
              </div>
              <span className="ml-2 font-medium">AI解析</span>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {currentStep === 'upload' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                描きたい写真を選択してください
              </h2>
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                isUploading={isUploading}
                error={error || undefined}
              />
            </div>
          )}

          {currentStep === 'material' && uploadedImageUrl && (
            <div>
              <MaterialSelector
                selectedMaterial={selectedMaterial}
                onMaterialSelect={handleMaterialSelect}
                textureStrength={textureStrength}
                onTextureStrengthChange={setTextureStrength}
              />
              
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  戻る
                </button>
                <button
                  onClick={handleStartAnalysis}
                  disabled={!selectedMaterial}
                  className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                    selectedMaterial
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  解析開始
                </button>
              </div>
            </div>
          )}
        </div>

        {/* アップロードされた画像のプレビュー（画材選択時） */}
        {currentStep === 'material' && uploadedImageUrl && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">選択された画像</h3>
            <div className="relative w-full max-w-md mx-auto">
              <img
                src={uploadedImageUrl}
                alt="アップロードされた画像"
                className="w-full rounded-lg shadow-md"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
