"use client";

import { useState } from "react";
import { ColorInfo } from "@/types/analysis";
import ColorRecipeModal from "./ColorRecipeModal";

interface ColorPaletteProps {
  colors: ColorInfo[];
  title?: string;
}

export default function ColorPalette({
  colors,
  title = "主要色",
}: ColorPaletteProps) {
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!colors || colors.length === 0) {
    return null;
  }

  const handleColorClick = (color: ColorInfo) => {
    setSelectedColor(color);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedColor(null);
  };

  return (
    <div className="parchment-card rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
        {colors.map((color, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            {/* 大きなカラーサンプル */}
            <button
              onClick={() => handleColorClick(color)}
              className="w-16 h-16 rounded-lg border-2 border-gray-200 shadow-md flex-shrink-0 transition-all hover:scale-105 hover:shadow-lg hover:border-blue-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ backgroundColor: color.hex }}
              title={`${color.name} (${color.hex}) - クリックして混色レシピを表示`}
            />

            {/* 色名（メイン） */}
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900 mb-1">
                {color.name}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {color.hex.toUpperCase()}
              </p>
              {/* 使用割合（小さく表示） */}
              <p className="text-xs text-gray-400 mt-1">{color.percentage}%</p>
            </div>
          </div>
        ))}
      </div>

      {/* 混色レシピモーダル */}
      {selectedColor && (
        <ColorRecipeModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          targetColor={{
            hex: selectedColor.hex,
            name: selectedColor.name,
          }}
        />
      )}
    </div>
  );
}
