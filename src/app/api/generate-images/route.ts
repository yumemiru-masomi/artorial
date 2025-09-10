import { NextRequest, NextResponse } from 'next/server';
import { ImageProcessor } from '@/lib/image-processor';
import { ApiResponse } from '@/types/api';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface GenerateImagesRequest {
  imageUrl: string;
  material: string;
  steps: Array<{
    stepNumber: number;
    title: string;
  }>;
}

interface GenerateImagesResponse {
  referenceImages: Array<{
    stepNumber: number;
    imageUrl: string;
    title: string;
  }>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: GenerateImagesRequest = await request.json();
    const { imageUrl, material, steps } = body;

    // バリデーション
    if (!imageUrl || typeof imageUrl !== 'string') {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '画像URLが指定されていません。',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!material || typeof material !== 'string') {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '画材が指定されていません。',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ステップ情報が提供されていません。',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 元画像の読み込み
    let inputBuffer: Buffer;
    try {
      if (imageUrl.startsWith('/uploads/')) {
        // ローカルファイルの場合
        const filePath = path.join(process.cwd(), 'public', imageUrl);
        inputBuffer = await readFile(filePath);
      } else {
        // 外部URLの場合
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        inputBuffer = Buffer.from(arrayBuffer);
      }
    } catch (error) {
      console.error('Image loading error:', error);
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: '元画像の読み込みに失敗しました。',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const imageProcessor = new ImageProcessor();
    const referenceImages: GenerateImagesResponse['referenceImages'] = [];

    // 参考画像保存用ディレクトリの作成
    const referenceDir = path.join(process.cwd(), 'public', 'references');
    if (!existsSync(referenceDir)) {
      await mkdir(referenceDir, { recursive: true });
    }

    // 各ステップの参考画像を生成
    for (const step of steps) {
      try {
        const processedBuffer = await imageProcessor.generateReferenceImages(
          inputBuffer,
          material,
          step.stepNumber,
          steps.length
        );

        // 圧縮
        const compressedBuffer = await imageProcessor.compressImage(processedBuffer, 800);

        // ファイル名生成
        const timestamp = Date.now();
        const fileName = `ref-${timestamp}-step${step.stepNumber}.jpg`;
        const filePath = path.join(referenceDir, fileName);

        // ファイル保存
        await writeFile(filePath, compressedBuffer);

        referenceImages.push({
          stepNumber: step.stepNumber,
          imageUrl: `/references/${fileName}`,
          title: step.title,
        });
      } catch (error) {
        console.error(`Reference image generation error for step ${step.stepNumber}:`, error);
        // エラーが発生したステップは参考画像なしで続行
        referenceImages.push({
          stepNumber: step.stepNumber,
          imageUrl: imageUrl, // 元画像をフォールバックとして使用
          title: step.title,
        });
      }
    }

    const response: ApiResponse<GenerateImagesResponse> = {
      success: true,
      data: {
        referenceImages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Generate images API error:', error);

    let errorMessage = '参考画像の生成に失敗しました。';
    const errorCode = 'GENERATION_ERROR';

    if (error instanceof Error) {
      if (error.message.includes('ENOENT') || error.message.includes('file')) {
        errorMessage = '画像ファイルが見つかりません。';
      } else if (error.message.includes('memory') || error.message.includes('size')) {
        errorMessage = '画像サイズが大きすぎます。小さい画像をお試しください。';
      }
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}