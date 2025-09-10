'use client';

import { ChevronLeft, ChevronRight, Clock, Lightbulb, CheckCircle, Eye, Palette } from 'lucide-react';
import { useState } from 'react';
import { GeneratedStep } from '@/types/analysis';
import { Material } from '@/types/tutorial';
import { ColorPalette as ColorPaletteType } from '@/types/color-palette';
import { ImageGenerationResponse } from '@/types/image-generation';
import Image from 'next/image';
import ColorPalette from './ColorPalette';

interface StepGuideProps {
  step: GeneratedStep;
  currentStepNumber: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  referenceImageUrl?: string;
  generatedImages?: ImageGenerationResponse['images'];
  colorPalette?: ColorPaletteType;
  originalImageUrl: string;
  material: Material;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export default function StepGuide({
  step,
  currentStepNumber,
  totalSteps,
  onPrevious,
  onNext,
  referenceImageUrl,
  generatedImages,
  colorPalette,
  originalImageUrl,
  material,
  isFirstStep,
  isLastStep,
}: StepGuideProps) {
  const [selectedImageType, setSelectedImageType] = useState<'reference' | 'lineArt' | 'flatColor' | 'highlight' | 'paintedSample' | 'original'>('reference');
  const [showColorPalette, setShowColorPalette] = useState(false);

  // 現在のステップに応じた最適な参考画像を選択
  const getRecommendedImageType = () => {
    if (!generatedImages) return 'reference';
    
    const stepTitle = step.title.toLowerCase();
    if (stepTitle.includes('下書き') || stepTitle.includes('輪郭') || stepTitle.includes('線画')) {
      return 'lineArt';
    } else if (stepTitle.includes('色塗り') || stepTitle.includes('ベース')) {
      return 'flatColor';
    } else if (stepTitle.includes('ハイライト') || stepTitle.includes('光')) {
      return 'highlight';
    } else if (stepTitle.includes('仕上げ') || stepTitle.includes('完成')) {
      return 'paintedSample';
    }
    return 'reference';
  };

  const getCurrentImageUrl = () => {
    if (selectedImageType === 'original') return originalImageUrl;
    if (selectedImageType === 'reference' && referenceImageUrl) return referenceImageUrl;
    if (generatedImages) {
      return generatedImages[selectedImageType as keyof typeof generatedImages] || referenceImageUrl || originalImageUrl;
    }
    return referenceImageUrl || originalImageUrl;
  };

  const getImageTypeLabel = (type: string) => {
    const labels = {
      reference: '参考画像',
      lineArt: '線画',
      flatColor: 'ベタ塗り',
      highlight: 'ハイライト',
      paintedSample: '完成見本',
      original: '元画像',
    };
    return labels[type as keyof typeof labels] || type;
  };
  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* 進捗バー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            ステップ {currentStepNumber} / {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStepNumber / totalSteps) * 100)}% 完了
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 画像セクション */}
        <div className="space-y-6">
          {/* 参考画像セクション */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {getImageTypeLabel(selectedImageType)} - {step.title}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowColorPalette(!showColorPalette)}
                  className={`p-2 rounded-lg transition-colors ${
                    showColorPalette 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={showColorPalette ? 'カラーパレットを非表示' : 'カラーパレットを表示'}
                >
                  <Palette className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 画像切り替えタブ */}
            {generatedImages && (
              <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
                {[
                  { type: 'reference', available: !!referenceImageUrl },
                  { type: 'lineArt', available: !!generatedImages.lineArt },
                  { type: 'flatColor', available: !!generatedImages.flatColor },
                  { type: 'highlight', available: !!generatedImages.highlight },
                  { type: 'paintedSample', available: !!generatedImages.paintedSample },
                  { type: 'original', available: true },
                ].filter(item => item.available).map(({ type }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedImageType(type as 'reference' | 'lineArt' | 'flatColor' | 'highlight' | 'paintedSample' | 'original')}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      selectedImageType === type
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {getImageTypeLabel(type)}
                  </button>
                ))}
              </div>
            )}

            <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={getCurrentImageUrl()}
                alt={`${getImageTypeLabel(selectedImageType)} - ステップ${step.stepNumber}`}
                className="w-full h-full object-cover rounded-lg"
              />
              
              {/* 推奨画像タイプのインジケーター */}
              {generatedImages && getRecommendedImageType() === selectedImageType && (
                <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  推奨
                </div>
              )}
            </div>
          </div>

          {/* カラーパレット */}
          {showColorPalette && colorPalette && (
            <ColorPalette
              palette={colorPalette}
              material={material}
              className="transition-all duration-300"
            />
          )}
        </div>

        {/* 指示セクション */}
        <div className="space-y-6">
          {/* ステップタイトルと推定時間 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {step.title}
              </h2>
              <div className="flex items-center text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-sm">{step.estimatedDuration}分</span>
              </div>
            </div>

            {/* 使用技法 */}
            {step.techniques && step.techniques.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">使用技法</h4>
                <div className="flex flex-wrap gap-2">
                  {step.techniques.map((technique, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                    >
                      {technique}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 詳細説明 */}
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {step.description}
              </p>
            </div>
          </div>

          {/* コツとアドバイス */}
          {step.tips && step.tips.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Lightbulb className="w-5 h-5 text-amber-600 mr-2" />
                <h3 className="text-lg font-semibold text-amber-800">
                  コツとアドバイス
                </h3>
              </div>
              <ul className="space-y-2">
                {step.tips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-amber-700 text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ナビゲーションボタン */}
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={onPrevious}
          disabled={isFirstStep}
          className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
            isFirstStep
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          前のステップ
        </button>

        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">
            ステップ {currentStepNumber} / {totalSteps}
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {step.title}
          </div>
        </div>

        <button
          onClick={onNext}
          className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
            isLastStep
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLastStep ? '完了' : '次のステップ'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}