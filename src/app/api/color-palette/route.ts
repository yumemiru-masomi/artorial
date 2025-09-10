import { NextRequest, NextResponse } from 'next/server';
import { ColorPaletteService } from '@/services/color-palette';
import { ApiResponse } from '@/types/api';
import { Material } from '@/types/tutorial';
import { ColorPaletteRequest, ColorPaletteResponse } from '@/types/color-palette';
import { readFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ColorPaletteRequest = await request.json();
    const { imageUrl, material, maxColors = 8 } = body;

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

    const validMaterials: Material[] = ['pencil', 'watercolor', 'colored-pencil', 'acrylic'];
    if (!validMaterials.includes(material as Material)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な画材が指定されました。',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (typeof maxColors !== 'number' || maxColors < 3 || maxColors > 12) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '色数は3〜12の範囲で指定してください。',
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

    // カラーパレット抽出処理
    try {
      const colorPaletteService = new ColorPaletteService();
      const colorPaletteResult = await colorPaletteService.extractColorPalette(
        inputBuffer,
        material as Material,
        maxColors
      );

      const response: ApiResponse<ColorPaletteResponse> = {
        success: true,
        data: colorPaletteResult,
      };

      return NextResponse.json(response);

    } catch (extractionError) {
      console.error('Color palette extraction error:', extractionError);
      
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: 'カラーパレットの抽出に失敗しました。',
        },
      };

      return NextResponse.json(errorResponse, { status: 500 });
    }

  } catch (error) {
    console.error('Color palette API error:', error);

    let errorMessage = 'カラーパレットの生成に失敗しました。';
    let errorCode = 'GENERATION_ERROR';

    if (error instanceof Error) {
      if (error.message.includes('ENOENT') || error.message.includes('file')) {
        errorMessage = '画像ファイルが見つかりません。';
      } else if (error.message.includes('memory') || error.message.includes('size')) {
        errorMessage = '画像サイズが大きすぎます。小さい画像をお試しください。';
      } else if (error.message.includes('timeout')) {
        errorMessage = '処理がタイムアウトしました。画像サイズを小さくしてお試しください。';
        errorCode = 'TIMEOUT_ERROR';
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

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'GETメソッドは対応していません。POSTメソッドを使用してください。',
      },
    },
    { status: 405 }
  );
}