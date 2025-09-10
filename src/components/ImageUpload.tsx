'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  isUploading?: boolean;
  disabled?: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUpload({ 
  onImageSelect, 
  onImageRemove, 
  isUploading = false, 
  disabled = false,
  error 
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '対応していない形式です。JPEG、PNG、WebP形式のファイルをアップロードしてください。';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'ファイルサイズが大きすぎます。5MB以下のファイルをアップロードしてください。';
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      // エラーハンドリングは親コンポーネントで処理
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    onImageSelect(file);
  }, [onImageSelect]);

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
      fileInputRef.current.value = '';
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
        <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
          <Image
            src={preview}
            alt="プレビュー画像"
            fill
            className="object-cover"
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
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className={`
          relative w-full h-64 border-2 border-dashed rounded-lg transition-colors cursor-pointer
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-gray-50'}
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
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-sm text-gray-600">アップロード中...</p>
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
                JPEG、PNG、WebP（最大5MB）
              </div>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}