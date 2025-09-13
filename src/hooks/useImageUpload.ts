'use client';

import { useState, useCallback } from 'react';
import { ApiResponse } from '@/types/api';

interface UseImageUploadReturn {
  uploadImage: (file: File) => Promise<string | null>;
  isUploading: boolean;
  error: string | null;
  progress: number;
  reset: () => void;
}

interface UploadResponse {
  imageUrl: string;
  fileName: string;
  size: number;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return '対応していない形式です。JPEG、PNG、WebP形式のファイルをアップロードしてください。';
    }

    if (file.size > maxSize) {
      return 'ファイルサイズが大きすぎます。5MB以下のファイルをアップロードしてください。';
    }

    return null;
  };

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return null;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response: ApiResponse<UploadResponse> = JSON.parse(xhr.responseText);
              if (response.success && response.data) {
                resolve(response.data.imageUrl);
              } else {
                const errorMessage = response.error?.message || 'アップロードに失敗しました。';
                setError(errorMessage);
                reject(new Error(errorMessage));
              }
            } catch {
              const errorMessage = 'サーバーからの応答を解析できませんでした。';
              setError(errorMessage);
              reject(new Error(errorMessage));
            }
          } else {
            const errorMessage = `アップロードに失敗しました。（エラーコード: ${xhr.status}）`;
            setError(errorMessage);
            reject(new Error(errorMessage));
          }
        });

        xhr.addEventListener('error', () => {
          const errorMessage = 'ネットワークエラーが発生しました。接続を確認してください。';
          setError(errorMessage);
          reject(new Error(errorMessage));
        });

        xhr.addEventListener('timeout', () => {
          const errorMessage = 'アップロードがタイムアウトしました。ファイルサイズを小さくしてお試しください。';
          setError(errorMessage);
          reject(new Error(errorMessage));
        });

        xhr.timeout = 60000; // 60秒タイムアウト
        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'アップロードに失敗しました。';
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
    setIsUploading(false);
  }, []);

  return {
    uploadImage,
    isUploading,
    error,
    progress,
    reset,
  };
}