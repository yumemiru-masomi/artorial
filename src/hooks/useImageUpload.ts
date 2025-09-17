"use client";

import { useState, useCallback } from "react";

interface UseImageUploadReturn {
  processFile: (file: File) => Promise<File | null>;
  isProcessing: boolean;
  error: string | null;
  reset: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "対応していない形式です。JPEG、PNG、WebP形式のファイルをアップロードしてください。";
    }

    if (file.size > maxSize) {
      return "ファイルサイズが大きすぎます。5MB以下のファイルをアップロードしてください。";
    }

    return null;
  };

  const processFile = useCallback(async (file: File): Promise<File | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // ファイルの検証のみ行い、そのまま返す
      // 実際の処理はAPIエンドポイントで行う
      return file;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "ファイルの処理に失敗しました。";
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    processFile,
    isProcessing,
    error,
    reset,
  };
}
