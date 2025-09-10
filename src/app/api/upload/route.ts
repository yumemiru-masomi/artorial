import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { ApiResponse } from '@/types/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadResponse {
  imageUrl: string;
  fileName: string;
  size: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ファイルが選択されていません。',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // ファイル形式の検証
    if (!ALLOWED_TYPES.includes(file.type)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '対応していない形式です。JPEG、PNG、WebP形式のファイルをアップロードしてください。',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // ファイルサイズの検証
    if (file.size > MAX_FILE_SIZE) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ファイルサイズが大きすぎます。5MB以下のファイルをアップロードしてください。',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // ファイル名の生成（タイムスタンプ + ランダム文字列）
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.name);
    const fileName = `${timestamp}-${randomString}${fileExtension}`;

    // アップロード先ディレクトリの作成
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // ファイルの保存
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // メタデータの除去（セキュリティ対策）
    // 実際の実装ではSharpを使用してメタデータを除去することを推奨
    await writeFile(filePath, buffer);

    // レスポンスデータの作成
    const imageUrl = `/uploads/${fileName}`;
    const response: ApiResponse<UploadResponse> = {
      success: true,
      data: {
        imageUrl,
        fileName,
        size: file.size,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: 'ファイルのアップロードに失敗しました。再試行してください。',
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}