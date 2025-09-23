"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Palette, ArrowRight } from "lucide-react";
import { ColorRecipeResponse, ColorRecipe } from "@/types/color-recipe";
import { ApiResponse } from "@/types/api";

interface ColorRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetColor: {
    hex: string;
    name: string;
  };
}

export default function ColorRecipeModal({
  isOpen,
  onClose,
  targetColor,
}: ColorRecipeModalProps) {
  const [recipe, setRecipe] = useState<ColorRecipeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダルが開かれた時に混色レシピを取得
  useEffect(() => {
    if (isOpen && targetColor.hex) {
      fetchColorRecipe();
    }
  }, [isOpen, targetColor.hex]);

  const fetchColorRecipe = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🎨 混色レシピ取得開始:", targetColor.hex);

      const response = await fetch("/api/color-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetHex: targetColor.hex,
        }),
      });

      const result: ApiResponse<ColorRecipeResponse> = await response.json();

      if (!result.success) {
        throw new Error(
          result.error?.message || "混色レシピの取得に失敗しました"
        );
      }

      setRecipe(result.data ?? null);
      console.log("✅ 混色レシピ取得成功:", result.data);
    } catch (err) {
      console.error("❌ 混色レシピ取得エラー:", err);
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: targetColor.hex }}
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">混色レシピ</h2>
              <p className="text-sm text-gray-600">
                {targetColor.name} ({targetColor.hex})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="animate-spin h-12 w-12 mx-auto text-blue-600 mb-4" />
                <p className="text-gray-600">混色レシピを生成中...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">⚠️</div>
                <div>
                  <h3 className="font-semibold text-red-800">エラー</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={fetchColorRecipe}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                再試行
              </button>
            </div>
          )}

          {recipe && !loading && !error && (
            <div className="space-y-6">
              {/* ターゲット色表示 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Palette className="w-4 h-4 mr-2" />
                  作りたい色
                </h3>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm"
                    style={{ backgroundColor: recipe.target }}
                  />
                  <div>
                    <p className="font-mono text-sm text-gray-600">
                      {recipe.target}
                    </p>
                    <p className="text-sm text-gray-500">{targetColor.name}</p>
                  </div>
                </div>
              </div>

              {/* レシピ一覧 */}
              {recipe.recipes.map((recipeItem, index) => (
                <RecipeCard
                  key={index}
                  recipe={recipeItem}
                  index={index}
                  targetColor={recipe.target}
                />
              ))}

              {recipe.recipes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>混色レシピが見つかりませんでした。</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 個別のレシピカードコンポーネント
function RecipeCard({
  recipe,
  index,
  targetColor,
}: {
  recipe: ColorRecipe;
  index: number;
  targetColor: string;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">
          {recipe.name === "best" ? "おすすめレシピ" : "代替レシピ"} #
          {index + 1}
        </h4>
        <div className="text-sm text-gray-500">
          誤差: {recipe.estimatedError.value.toFixed(1)}
        </div>
      </div>

      {/* 混色の材料 */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">使用する絵具</h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {recipe.mix.map((color, colorIndex) => (
            <div
              key={colorIndex}
              className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2"
            >
              <div
                className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: color.hex }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {color.name}
                </p>
                <p className="text-xs text-gray-600">{color.ratio}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 混ぜる順番 */}
      {recipe.order.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">混ぜる順番</h5>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {recipe.order.map((colorName, orderIndex) => (
              <div key={orderIndex} className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {orderIndex + 1}. {colorName}
                </span>
                {orderIndex < recipe.order.length - 1 && (
                  <ArrowRight className="w-3 h-3 mx-1 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 結果色と説明 */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <p className="text-xs text-gray-500 mb-1">予想される色</p>
          <div
            className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: recipe.estimatedResultHex }}
          />
          <p className="text-xs text-gray-500 mt-1 font-mono">
            {recipe.estimatedResultHex}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">手順</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {recipe.sentence_ja}
          </p>
        </div>
      </div>
    </div>
  );
}
