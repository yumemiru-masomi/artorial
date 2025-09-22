"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Camera } from "lucide-react";
import NextImage from "next/image";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  isProcessing?: boolean;
  disabled?: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_IMAGE_SIZE = 1024; // 最大画像サイズ（px）
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUpload({
  onImageSelect,
  onImageRemove,
  isProcessing = false,
  disabled = false,
  error,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "対応していない形式です。JPEG、PNG、WebP形式のファイルをアップロードしてください。";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "ファイルサイズが大きすぎます。2MB以下のファイルをアップロードしてください。";
    }
    return null;
  };

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        // アスペクト比を保持してリサイズ
        const scale = Math.min(
          MAX_IMAGE_SIZE / img.width,
          MAX_IMAGE_SIZE / img.height
        );

        if (scale >= 1) {
          // リサイズ不要
          resolve(file);
          return;
        }

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          0.8
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        // エラーハンドリングは親コンポーネントで処理
        return;
      }

      const resizedFile = await resizeImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(resizedFile);
      onImageSelect(resizedFile);
    },
    [onImageSelect]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (preview) {
    return (
      <div className="relative">
        <div className="relative w-full max-w-md mx-auto aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
          <NextImage
            src={preview}
            alt="プレビュー画像"
            fill
            className="object-contain"
            unoptimized
          />
          {!disabled && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              aria-label="画像を削除"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className={`
          relative w-full h-64 border-2 border-dashed rounded-lg transition-colors cursor-pointer
          ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300"}
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-blue-400 hover:bg-gray-50"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-sm text-gray-600">処理中...</p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-blue-100 rounded-full">
                <Camera className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                描きたい写真をアップロード
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                ファイルをここにドラッグ&ドロップするか、クリックして選択してください
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <Upload size={14} className="mr-1" />
                JPEG、PNG、WebP（最大2MB）
              </div>
            </>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
