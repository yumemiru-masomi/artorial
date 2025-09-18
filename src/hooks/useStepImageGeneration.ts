"use client";

import { useState, useCallback } from "react";
import { GeneratedStep } from "@/types/analysis";
import { Material } from "@/types/tutorial";

interface UseStepImageGenerationProps {
  allSteps: GeneratedStep[];
  originalImageUrl: string;
  material: Material;
}

interface UseStepImageGenerationReturn {
  stepImages: (string | null)[];
  loading: boolean;
  generateCurrentStepImage: (stepIndex: number) => Promise<void>;
  getCurrentStepImage: (currentStepNumber: number) => string;
}

export function useStepImageGeneration({
  allSteps,
  originalImageUrl,
  material,
}: UseStepImageGenerationProps): UseStepImageGenerationReturn {
  const [stepImages, setStepImages] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(false);

  // ステップ画像を生成する関数
  const generateStepImage = useCallback(
    async (stepIndex: number): Promise<string | null> => {
      try {
        const targetStep = allSteps[stepIndex];
        if (!targetStep) return null;

        const response = await fetch("/api/generate-step-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            originalImageUrl,
            stepNumber: stepIndex + 1,
            stepDescription: targetStep.description,
            material,
            previousStepImageUrl: stepImages[stepIndex - 1] || null,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          return data.data.imageUrl;
        } else {
          throw new Error(data.error?.message || "Failed to generate image");
        }
      } catch (error) {
        console.error(`Error generating step ${stepIndex + 1} image:`, error);
        return null;
      }
    },
    [allSteps, originalImageUrl, material, stepImages]
  );

  // 現在のステップの画像のみを生成する関数（コスト削減）
  const generateCurrentStepImage = useCallback(
    async (stepIndex: number) => {
      // 既に生成済みの場合はスキップ
      if (stepImages[stepIndex]) {
        console.log(
          `✅ ステップ${stepIndex + 1}の画像は既に生成済み - スキップ`
        );
        return;
      }

      console.log(`📸 ステップ${stepIndex + 1}の画像を生成中...`);

      try {
        setLoading(true);
        const currentImageUrl = await generateStepImage(stepIndex);

        if (currentImageUrl) {
          setStepImages((prev) => {
            const newArray = [...prev];
            newArray[stepIndex] = currentImageUrl;
            return newArray;
          });
          console.log(`✅ ステップ${stepIndex + 1}の画像生成完了`);
        } else {
          console.warn(`⚠️ ステップ${stepIndex + 1}の画像生成に失敗`);
        }
      } catch (error) {
        console.error(`❌ ステップ${stepIndex + 1}の画像生成エラー:`, error);
      } finally {
        setLoading(false);
      }
    },
    [stepImages, generateStepImage]
  );

  // 現在のステップの画像を取得
  const getCurrentStepImage = useCallback(
    (currentStepNumber: number): string => {
      const currentIndex = currentStepNumber - 1;
      return stepImages[currentIndex] || originalImageUrl;
    },
    [stepImages, originalImageUrl]
  );

  return {
    stepImages,
    loading,
    generateCurrentStepImage,
    getCurrentStepImage,
  };
}
