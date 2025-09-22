"use client";

import { ColorInfo } from "@/types/analysis";

interface ColorPaletteProps {
  colors: ColorInfo[];
  title?: string;
}

export default function ColorPalette({
  colors,
  title = "主要色",
}: ColorPaletteProps) {
  if (!colors || colors.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {colors.map((color, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            {/* 大きなカラーサンプル */}
            <div
              className="w-16 h-16 rounded-lg border-2 border-gray-200 shadow-md flex-shrink-0 transition-transform hover:scale-105"
              style={{ backgroundColor: color.hex }}
              title={`${color.name} (${color.hex})`}
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
    </div>
  );
}
