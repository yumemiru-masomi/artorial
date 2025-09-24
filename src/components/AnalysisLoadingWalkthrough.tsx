"use client";

import { useState, useEffect } from "react";

const LOADING_MESSAGES = [
  "私がこれからあなたからもらった画像を見て",
  "難易度と使われている色をお伝えします",
  "それを見て、大丈夫でしたら",
  "手順を表示するボタンを押して下さい",
];

interface AnalysisLoadingWalkthroughProps {
  onSkip?: () => void;
}

export default function AnalysisLoadingWalkthrough({
  onSkip,
}: AnalysisLoadingWalkthroughProps = {}) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (currentMessageIndex < LOADING_MESSAGES.length) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          if (currentMessageIndex < LOADING_MESSAGES.length - 1) {
            setCurrentMessageIndex((prev) => prev + 1);
            setIsAnimating(true);
          } else {
            // 最後のメッセージの後にスピナーを表示
            setShowSpinner(true);
          }
        }, 500);
      }, 2500); // 各メッセージを2.5秒表示

      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        backgroundImage: "url('/water-lilies-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-opacity-50"></div>
      <div className="relative text-center px-8">
        {!showSpinner ? (
          <>
            <div
              className={`transition-all duration-500 ${
                isAnimating
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-4"
              }`}
            >
              <p className="text-xl md:text-2xl text-white font-bold mb-8 leading-relaxed drop-shadow-lg">
                {LOADING_MESSAGES[currentMessageIndex]}
              </p>
            </div>

            {/* 小さなskipボタン - アニメーション対象外で常に表示 */}
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-white text-opacity-50 hover:text-opacity-80 transition-colors text-sm underline mt-2"
              >
                skip
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            {/* スピナー */}
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
            <p className="text-xl md:text-2xl text-white font-bold leading-relaxed drop-shadow-lg">
              どんな絵か見ますので、少々お待ちください...
            </p>
            <p className="text-sm text-white text-opacity-80 drop-shadow-lg">
              画像の複雑さと難易度を分析しています
            </p>

            {/* スピナー表示時のskipボタン */}
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-white text-opacity-50 hover:text-opacity-80 transition-colors text-sm underline mt-4"
              >
                skip
              </button>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
