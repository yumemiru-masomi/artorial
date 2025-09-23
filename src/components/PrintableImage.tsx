"use client";

import React from "react";

interface PrintableImageProps {
  imageUrl: string;
  stepTitle: string;
  stepNumber: number;
  componentRef: React.MutableRefObject<HTMLDivElement | null>;
}

/**
 * 印刷専用の画像表示コンポーネント
 * 下書き画像のみを印刷対象とし、手順説明は含めない
 */
const PrintableImage: React.FC<PrintableImageProps> = ({
  imageUrl,
  stepTitle,
  stepNumber,
  componentRef,
}) => {
  return (
    <div ref={componentRef} className="printable-image-container">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {/* ステップ情報（簡潔に） */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ステップ {stepNumber}: {stepTitle}
          </h1>
          <p className="text-gray-600">下書き画像</p>
        </div>

        {/* 画像表示 */}
        <div className="flex-1 flex items-center justify-center max-w-full">
          <img
            src={imageUrl}
            alt={`ステップ${stepNumber}: ${stepTitle} - 下書き画像`}
            className="max-w-full max-h-[70vh] object-contain print-image"
            onLoad={() => console.log("印刷用画像読み込み完了")}
            onError={() => console.error("印刷用画像読み込みエラー")}
          />
        </div>
      </div>

      {/* 印刷専用スタイル */}
      <style jsx global>{`
        @media print {
          /* ページ設定 */
          @page {
            size: A4;
            margin: 15mm;
          }

          .printable-image-container {
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }

          /* 背景色・画像を印刷に含める */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 印刷用画像の最適化 */
          .print-image {
            max-width: 90% !important;
            max-height: 75vh !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            page-break-inside: avoid !important;
            display: block !important;
          }

          /* テキストの調整 */
          h1 {
            font-size: 16pt !important;
            margin-bottom: 10pt !important;
            color: #000 !important;
            text-align: center !important;
          }

          p {
            font-size: 10pt !important;
            margin-bottom: 15pt !important;
            color: #666 !important;
            text-align: center !important;
          }

          /* 他の要素を非表示にする */
          body > *:not([data-print-content]) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableImage;
