import { NextRequest, NextResponse } from 'next/server';
import { ColorPaletteService } from '@/services/color-palette';
import { ApiResponse } from '@/types/api';
import { Material } from '@/types/tutorial';
import { ColorAnalysis, MixingRecipe } from '@/types/color-palette';

interface MixingRecipeRequest {
  color: ColorAnalysis;
  material: Material;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: MixingRecipeRequest = await request.json();
    const { color, material } = body;

    // バリデーション
    if (!color || !color.rgb || !color.hex) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '色情報が指定されていません。',
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

    // 混色レシピを生成
    try {
      const colorPaletteService = new ColorPaletteService();
      const mixingRecipe = colorPaletteService.generateMixingRecipe(color, material as Material);

      const response: ApiResponse<MixingRecipe> = {
        success: true,
        data: mixingRecipe,
      };

      return NextResponse.json(response);

    } catch (generationError) {
      console.error('Mixing recipe generation error:', generationError);
      
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: '混色レシピの生成に失敗しました。',
        },
      };

      return NextResponse.json(errorResponse, { status: 500 });
    }

  } catch (error) {
    console.error('Mixing recipe API error:', error);

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: '混色レシピの生成に失敗しました。',
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