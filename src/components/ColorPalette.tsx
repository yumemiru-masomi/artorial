'use client';

import { useState } from 'react';
import { Palette, Droplet, Info } from 'lucide-react';
import { ColorAnalysis, ColorPalette as ColorPaletteType, MixingRecipe } from '@/types/color-palette';
import { Material } from '@/types/tutorial';
// Import type only to avoid bundling server-side code on client
// import type { ColorPaletteService } from '@/services/color-palette';

interface ColorPaletteProps {
  palette: ColorPaletteType;
  material: Material;
  onColorSelect?: (color: ColorAnalysis) => void;
  className?: string;
}

interface ColorDetailsModalProps {
  color: ColorAnalysis;
  material: Material;
  isOpen: boolean;
  onClose: () => void;
}

const ColorDetailsModal = ({ color, material, isOpen, onClose }: ColorDetailsModalProps) => {
  const [mixingRecipe, setMixingRecipe] = useState<MixingRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleShowMixingRecipe = async () => {
    if (mixingRecipe) return;
    
    setIsLoading(true);
    try {
      // Call API endpoint instead of direct service call to avoid client-side import issues
      const response = await fetch('/api/mixing-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          color: color,
          material: material,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMixingRecipe(data.data);
      } else {
        console.error('調色レシピの取得に失敗しました');
      }
    } catch (error) {
      console.error('調色レシピの生成に失敗しました:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">色の詳細</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 色見本 */}
          <div className="flex items-center space-x-4 mb-6">
            <div
              className="w-16 h-16 rounded-lg border border-gray-200"
              style={{ backgroundColor: color.hex }}
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{color.colorName}</h3>
              <p className="text-sm text-gray-600">出現頻度: {Math.round(color.frequency * 100)}%</p>
            </div>
          </div>

          {/* カラー情報 */}
          <div className="space-y-4 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">色情報</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">HEX</div>
                  <div className="text-gray-900 font-mono">{color.hex.toUpperCase()}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">RGB</div>
                  <div className="text-gray-900">{color.rgb.r}, {color.rgb.g}, {color.rgb.b}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">色相 (H)</div>
                  <div className="text-gray-900">{color.hsv.h}°</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">彩度 (S)</div>
                  <div className="text-gray-900">{color.hsv.s}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* 混色レシピ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">混色レシピ</h4>
              {!mixingRecipe && (
                <button
                  onClick={handleShowMixingRecipe}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {isLoading ? '生成中...' : '表示する'}
                </button>
              )}
            </div>
            
            {mixingRecipe ? (
              <div className="space-y-4">
                {/* 基本色の配合 */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">基本色の配合</h5>
                  <div className="space-y-2">
                    {mixingRecipe.basicColors.map((basicColor, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded border border-gray-200"
                          style={{ backgroundColor: basicColor.hex }}
                        />
                        <span className="text-sm text-gray-900">{basicColor.name}</span>
                        <span className="text-sm text-gray-600">{basicColor.ratio}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 混色手順 */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">混色手順</h5>
                  <ol className="text-sm text-gray-900 space-y-1">
                    {mixingRecipe.steps.map((step, index) => (
                      <li key={index} className="flex">
                        <span className="text-blue-600 mr-2">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* 画材別のコツ */}
                {mixingRecipe.materialSpecific?.[material] && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      {getMaterialName(material)}でのコツ
                    </h5>
                    <div className="text-sm text-gray-900">
                      <p className="font-medium mb-1">{mixingRecipe.materialSpecific[material]!.technique}</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {mixingRecipe.materialSpecific[material]!.tips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                      {mixingRecipe.materialSpecific[material]!.warnings && (
                        <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                          <div className="text-yellow-800">
                            <strong>注意:</strong> {mixingRecipe.materialSpecific[material]!.warnings![0]}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                混色レシピを表示するには「表示する」ボタンをクリックしてください
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getMaterialName = (material: Material): string => {
  const names = {
    pencil: 'デッサン',
    watercolor: '水彩画',
    'colored-pencil': '色鉛筆',
    acrylic: 'アクリル絵の具',
  };
  return names[material];
};

export default function ColorPalette({
  palette,
  material,
  onColorSelect,
  className = '',
}: ColorPaletteProps) {
  const [selectedColor, setSelectedColor] = useState<ColorAnalysis | null>(null);

  const handleColorClick = (color: ColorAnalysis) => {
    setSelectedColor(color);
    if (onColorSelect) {
      onColorSelect(color);
    }
  };

  const getTemperatureDisplay = (temp: string) => {
    switch (temp) {
      case 'warm': return { text: '暖色系', color: 'text-orange-600' };
      case 'cool': return { text: '寒色系', color: 'text-blue-600' };
      default: return { text: '中間色', color: 'text-gray-600' };
    }
  };

  const tempDisplay = getTemperatureDisplay(palette.temperature);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">カラーパレット</h3>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <span className={`font-medium ${tempDisplay.color}`}>
            {tempDisplay.text}
          </span>
          <span className="text-gray-600">
            複雑度: {palette.complexity}/10
          </span>
        </div>
      </div>

      {/* ドミナントカラー */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">主要色</h4>
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
            style={{ backgroundColor: palette.dominantColor.hex }}
            onClick={() => handleColorClick(palette.dominantColor)}
          />
          <div>
            <p className="font-medium text-gray-900">{palette.dominantColor.colorName}</p>
            <p className="text-sm text-gray-600">
              出現頻度: {Math.round(palette.dominantColor.frequency * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* カラーパレットグリッド */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">抽出された色</h4>
        <div className="grid grid-cols-4 gap-3">
          {palette.colors.slice(0, 8).map((color, index) => (
            <div key={index} className="group">
              <div
                className="w-full h-16 rounded-lg border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all group-hover:scale-105"
                style={{ backgroundColor: color.hex }}
                onClick={() => handleColorClick(color)}
              />
              <div className="mt-1 text-xs text-center">
                <p className="font-medium text-gray-900 truncate">{color.colorName}</p>
                <p className="text-gray-500">{Math.round(color.frequency * 100)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 補色 */}
      {palette.complementaryColors.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Droplet className="w-4 h-4 mr-1" />
            補色
          </h4>
          <div className="flex space-x-2">
            {palette.complementaryColors.map((color, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                style={{ backgroundColor: color.hex }}
                onClick={() => handleColorClick(color)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 情報ボタン */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <Info className="w-4 h-4 mr-1" />
          色をクリックすると混色レシピを確認できます
        </div>
      </div>

      {/* カラー詳細モーダル */}
      {selectedColor && (
        <ColorDetailsModal
          color={selectedColor}
          material={material}
          isOpen={true}
          onClose={() => setSelectedColor(null)}
        />
      )}
    </div>
  );
}