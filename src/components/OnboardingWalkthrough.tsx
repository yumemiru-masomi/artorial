"use client";

import MaterialsListModal from "@/components/MaterialsListModal";
import { useState, useEffect } from "react";

interface OnboardingWalkthroughProps {
  onComplete: () => void;
}

const ONBOARDING_MESSAGES = [
  "ようこそ、Artorialへ",
  "Artorialは、アクリル絵の具でを描くことを通して",
  "リラックスや、リフレッシュしてもらうことを目的としています",
  "絵を上手く描こう、綺麗に仕上げようとは思わなくて大丈夫です",
  "これから、私が絵の描き方をお伝えしますので",
  "あなたのお好きな絵を、お好きな時にお好きな形や色で描いて下さい",
  "それでは、自由に自分らしい絵を描くことをお楽しみください",
];

export default function OnboardingWalkthrough({
  onComplete,
}: OnboardingWalkthroughProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showMaterialsButton, setShowMaterialsButton] = useState(false);
  const [showMaterialsList, setShowMaterialsList] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (currentMessageIndex < ONBOARDING_MESSAGES.length) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          if (currentMessageIndex < ONBOARDING_MESSAGES.length - 1) {
            setCurrentMessageIndex((prev) => prev + 1);
            setIsAnimating(true);
          } else {
            // 最後のメッセージの後に必要なものリストボタンを表示
            setShowMaterialsButton(true);
          }
        }, 500);
      }, 3500); // 各メッセージを3.5秒表示

      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex]);

  const handleShowMaterials = () => {
    setShowMaterialsList(true);
  };

  const handleCompleteOnboarding = () => {
    onComplete();
  };

  if (showMaterialsList) {
    return (
      <MaterialsListModal
        isOpen={showMaterialsList}
        onClose={() => setShowMaterialsList(false)}
      />
    );
  }

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
      <div className="absolute inset-0 bg-opacity-20"></div>
      <div className="relative text-center px-8">
        <div
          className={`transition-all duration-500 ${
            isAnimating
              ? "opacity-100 transform translate-y-0"
              : "opacity-0 transform translate-y-4"
          }`}
        >
          <p className="text-xl md:text-2xl text-white font-bold mb-8 leading-relaxed drop-shadow-lg">
            {ONBOARDING_MESSAGES[currentMessageIndex]}
          </p>
        </div>

        {/* 小さなskipボタン - 最終画面では非表示 */}
        {!showMaterialsButton && (
          <button
            onClick={handleCompleteOnboarding}
            className="text-white text-opacity-50 hover:text-opacity-80 transition-colors text-sm underline mt-2"
          >
            skip
          </button>
        )}

        {showMaterialsButton && (
          <div className="mt-12 space-y-4 animate-fade-in">
            <button
              onClick={handleShowMaterials}
              className="px-8 py-4 bg-sage-light text-white rounded-lg font-medium hover:bg-sage-light transition-colors text-lg"
            >
              絵を描く時に必要なものリスト
            </button>
            <div>
              <button
                onClick={handleCompleteOnboarding}
                className="text-white text-opacity-70 hover:text-opacity-100 transition-colors underline"
              >
                用意できたので、始める
              </button>
            </div>
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
