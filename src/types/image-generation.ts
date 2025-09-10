import { Material } from './tutorial';

export interface GeneratedImages {
  lineArt: Buffer;
  flatColor: Buffer;
  highlight: Buffer;
  paintedSample: Buffer;
}

export interface ImageGenerationRequest {
  imageUrl: string;
  material: Material;
  textureStrength?: number;
}

export interface ImageGenerationResponse {
  images: {
    lineArt: string;
    flatColor: string;
    highlight: string;
    paintedSample: string;
  };
  material: Material;
  textureStrength: number;
}

export interface ImageGenerationError {
  code: 'TIMEOUT' | 'GENERATION_ERROR' | 'NETWORK_ERROR';
  message: string;
  fallback?: boolean;
}