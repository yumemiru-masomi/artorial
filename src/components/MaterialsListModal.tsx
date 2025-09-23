"use client";

import { useState } from "react";

interface MaterialsListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MATERIALS = [
  { id: "pencil", name: "鉛筆" },
  { id: "eraser", name: "消しゴム" },
  { id: "tracing-paper", name: "トレーシングペーパー" },
  { id: "canvas", name: "キャンバス(紙)" },
  { id: "paint", name: "絵の具(12色)" },
  { id: "palette", name: "パレット" },
  { id: "brushes", name: "筆(平筆・丸筆)" },
  { id: "bucket", name: "筆を洗うバケツ" },
];

export default function MaterialsListModal({
  isOpen,
  onClose,
}: MaterialsListModalProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleCheckChange = (itemId: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="parchment-card p-8 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          絵を描く時に必要なものリスト
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              必要なもの
            </h3>
            <div className="space-y-3">
              {MATERIALS.map((material) => (
                <label
                  key={material.id}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checkedItems.has(material.id)}
                    onChange={() => handleCheckChange(material.id)}
                    className="w-5 h-5 focus:ring-sage-light focus:ring-2 border-gray-300 rounded"
                    style={{ accentColor: "#8fa89f" }}
                  />
                  <span className="text-gray-700 text-lg">{material.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-sage-light bg-opacity-20 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">ポイント</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• ほとんどの商品を100均で買うことができます</p>
              <p>
                •
                このアプリは、絵の具だけこちらの12色アクリルガッシュを基準に色を作る方法を説明しています。
              </p>
              <div className="mt-3">
                <a
                  href="https://www.turner.co.jp/brand/acrylgouache/ag-12c/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-white hover:text-gray-200 underline font-medium"
                >
                  詳細はこちら
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-sage-light text-white rounded-lg font-medium hover:bg-sage transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
