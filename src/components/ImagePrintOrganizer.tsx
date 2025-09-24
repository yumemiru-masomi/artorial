"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer } from "lucide-react";
import PrintableImage from "./PrintableImage";

export interface ImagePrintOrganizerProps {
  imageUrl: string;
  stepTitle: string;
  stepNumber: number;
  isImageReady: boolean;
}

/**
 * 画像印刷管理コンポーネント
 * react-to-printを使用して下書き画像のみを印刷する
 */
const ImagePrintOrganizer: React.FC<ImagePrintOrganizerProps> = ({
  imageUrl,
  stepTitle,
  stepNumber,
  isImageReady,
}) => {
  const componentRef = useRef<HTMLDivElement | null>(null);

  /**
   * 印刷時のスタイル設定
   * A4サイズに最適化し、画像のみを印刷対象にする
   */
  const pageStyle = `
    @page { 
      size: A4;
      margin: 15mm;
    }
    
    @media print {
      /* 全体のリセット */
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* bodyの設定 */
      body { 
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        background-image: none !important;
      }
      
      /* 印刷時に他の要素を完全に非表示 */
      body > *:not([data-print-content]) {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* 背景画像やパターンを除去 */
      body::before,
      body::after,
      *::before,
      *::after {
        background: none !important;
        background-image: none !important;
        display: none !important;
      }
      
      /* 印刷対象のコンテナ */
      [data-print-content] {
        width: 100% !important;
        height: 100vh !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        padding: 20mm !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        background: white !important;
        background-image: none !important;
        position: relative !important;
        z-index: 9999 !important;
      }
      
      /* 画像の最適化 */
      .print-image {
        max-width: 100% !important;
        max-height: 80vh !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
        display: block !important;
        page-break-inside: avoid !important;
        border: none !important;
        box-shadow: none !important;
        background: white !important;
      }
      
      /* テキストの調整 */
      h1 {
        font-size: 16pt !important;
        margin-bottom: 10pt !important;
        page-break-after: avoid !important;
        color: #000 !important;
        text-align: center !important;
        background: white !important;
      }
      
      p {
        font-size: 10pt !important;
        margin-bottom: 15pt !important;
        page-break-after: avoid !important;
        color: #666 !important;
        text-align: center !important;
        background: white !important;
      }
    }
  `;

  /**
   * 印刷プレビューを表示
   */
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    pageStyle,
    preserveAfterPrint: false,
    documentTitle: `ステップ${stepNumber}_${stepTitle}_下書き画像`,
    onBeforePrint: async () => {
      // 印刷前の準備処理
      if (componentRef.current) {
        componentRef.current.setAttribute("data-print-content", "true");

        // 画像の読み込み完了を待つ
        const images = componentRef.current.querySelectorAll("img");
        const imagePromises = Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();

          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            // タイムアウト設定（5秒）
            setTimeout(reject, 5000);
          });
        });

        try {
          await Promise.all(imagePromises);
        } catch (error) {}
      }
    },
    onAfterPrint: () => {
      // 印刷後のクリーンアップ
      if (componentRef.current) {
        componentRef.current.removeAttribute("data-print-content");
      }
    },
  });

  return (
    <>
      {/* 印刷ボタン */}
      <button
        onClick={handlePrint}
        disabled={!isImageReady}
        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          isImageReady
            ? "bg-sage text-white hover:bg-sage hover:shadow-md"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
        title={
          isImageReady ? "下書き画像を印刷" : "画像生成中のため印刷できません"
        }
      >
        <Printer className="w-4 h-4 mr-2" />
        {isImageReady ? "画像を印刷" : "生成中..."}
      </button>

      {/* 印刷対象（非表示） */}
      <div style={{ display: "none" }}>
        <PrintableImage
          imageUrl={imageUrl}
          stepTitle={stepTitle}
          stepNumber={stepNumber}
          componentRef={componentRef as React.RefObject<HTMLDivElement>}
        />
      </div>
    </>
  );
};

export default ImagePrintOrganizer;
