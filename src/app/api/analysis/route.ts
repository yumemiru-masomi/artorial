import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/services/gemini';
import { ApiResponse } from '@/types/api';
import { ImageAnalysisResponse } from '@/types/analysis';
import { Material } from '@/types/tutorial';

const VALID_MATERIALS: Material[] = ['pencil', 'watercolor', 'colored-pencil', 'acrylic'];
const ANALYSIS_TIMEOUT = 30000; // 30秒

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { imageUrl, material } = body;

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

    if (!material || !VALID_MATERIALS.includes(material)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '有効な画材が選択されていません。',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Gemini APIキーの確認
    if (!process.env.GEMINI_API_KEY) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: 'ANALYSIS_ERROR',
          message: 'AI解析サービスが設定されていません。',
        },
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const geminiService = new GeminiService();

    // タイムアウト付きで解析実行
    const analysisPromise = geminiService.analyzeImage(imageUrl, material);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, ANALYSIS_TIMEOUT);
    });

    try {
      const analysisResult = await Promise.race([analysisPromise, timeoutPromise]);

      // 解析結果の検証
      if (!analysisResult.difficulty || !analysisResult.subjects || typeof analysisResult.complexity !== 'number') {
        throw new Error('Invalid analysis result');
      }

      const response: ApiResponse<ImageAnalysisResponse> = {
        success: true,
        data: {
          difficulty: analysisResult.difficulty,
          complexity: Math.max(1, Math.min(10, analysisResult.complexity)), // 1-10の範囲に制限
          subjects: analysisResult.subjects,
          estimatedTime: Math.max(30, analysisResult.estimatedTime || 60), // 最低30分
          reasoning: analysisResult.reasoning || '分析が完了しました。',
          confidence: Math.max(0, Math.min(1, analysisResult.confidence || 0.8)), // 0-1の範囲に制限
        },
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === 'TIMEOUT') {
        const errorResponse: ApiResponse<null> = {
          success: false,
          error: {
            code: 'TIMEOUT_ERROR',
            message: '処理に時間がかかりすぎています。画像サイズを小さくしてお試しください。',
          },
        };
        return NextResponse.json(errorResponse, { status: 408 });
      }

      throw error; // 他のエラーは外側のcatchブロックで処理
    }
  } catch (error) {
    console.error('Analysis API error:', error);

    let errorMessage = '画像の解析に失敗しました。別の画像をお試しください。';
    let errorCode = 'ANALYSIS_ERROR';

    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('quota')) {
        errorMessage = 'AI解析サービスでエラーが発生しました。しばらく待ってから再試行してください。';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'ネットワーク接続を確認してください。';
        errorCode = 'NETWORK_ERROR';
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