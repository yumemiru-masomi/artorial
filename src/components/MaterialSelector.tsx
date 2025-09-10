'use client';

// import { useState } from 'react';
import { Pencil, Droplets, Palette, Paintbrush2 } from 'lucide-react';
import { Material } from '@/types/tutorial';

interface MaterialSelectorProps {
  selectedMaterial: Material | null;
  onMaterialSelect: (material: Material) => void;
  textureStrength?: number;
  onTextureStrengthChange?: (strength: number) => void;
  disabled?: boolean;
}

interface MaterialOption {
  id: Material;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

const materialOptions: MaterialOption[] = [
  {
    id: 'pencil',
    name: 'デッサン',
    description: '鉛筆を使った基礎的な描画技法',
    icon: Pencil,
    features: ['陰影表現', '立体感', '基礎技法'],
  },
  {
    id: 'watercolor',
    name: '水彩画',
    description: '透明水彩絵の具を使った表現',
    icon: Droplets,
    features: ['透明感', 'グラデーション', '色彩表現'],
  },
  {
    id: 'colored-pencil',
    name: '色鉛筆',
    description: '色鉛筆を使った色彩豊かな表現',
    icon: Palette,
    features: ['細密表現', '重ね塗り', '質感表現'],
  },
  {
    id: 'acrylic',
    name: 'アクリル絵の具',
    description: 'アクリル絵の具を使った力強い表現',
    icon: Paintbrush2,
    features: ['発色', 'テクスチャ', '重厚感'],
  },
];

export default function MaterialSelector({
  selectedMaterial,
  onMaterialSelect,
  textureStrength = 40,
  onTextureStrengthChange,
  disabled = false,
}: MaterialSelectorProps) {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          画材を選択してください
        </h2>
        <p className="text-gray-600">
          使用したい画材を選択すると、その画材に特化した描画手順を生成します
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {materialOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedMaterial === option.id;

          return (
            <button
              key={option.id}
              onClick={() => onMaterialSelect(option.id)}
              disabled={disabled}
              className={`
                relative p-6 rounded-lg border-2 text-left transition-all duration-200
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-4">
                <div
                  className={`
                    p-3 rounded-lg
                    ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                  `}
                >
                  <Icon className="w-8 h-8" />
                </div>

                <div className="flex-1">
                  <h3
                    className={`
                      font-semibold text-lg mb-2
                      ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                    `}
                  >
                    {option.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {option.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {option.features.map((feature) => (
                      <span
                        key={feature}
                        className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${
                            isSelected
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }
                        `}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedMaterial && onTextureStrengthChange && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            質感の強さを設定
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            生成する参考画像に適用する{materialOptions.find((m) => m.id === selectedMaterial)?.name}の質感の強さを調整できます
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>弱め</span>
              <span className="font-medium">質感の強さ: {textureStrength}%</span>
              <span>強め</span>
            </div>
            
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={textureStrength}
              onChange={(e) => onTextureStrengthChange(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${textureStrength}%, #e5e7eb ${textureStrength}%, #e5e7eb 100%)`
              }}
            />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            {textureStrength <= 20 && "非常に控えめな質感で、基本的な形と色に重点を置きます"}
            {textureStrength > 20 && textureStrength <= 40 && "適度な質感で、バランスの取れた表現になります"}
            {textureStrength > 40 && textureStrength <= 70 && "明確な質感で、画材の特徴がよく表現されます"}
            {textureStrength > 70 && "強い質感で、画材の特徴が際立つ表現になります"}
          </div>
        </div>
      )}

      {selectedMaterial && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-green-800 font-medium">
              {materialOptions.find((m) => m.id === selectedMaterial)?.name}を選択しました
            </p>
          </div>
          <p className="text-green-700 text-sm mt-1">
            解析開始ボタンをクリックして、AI による画像解析を開始してください
          </p>
        </div>
      )}
    </div>
  );
}