export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export enum ErrorType {
  UPLOAD_ERROR = "UPLOAD_ERROR",
  ANALYSIS_ERROR = "ANALYSIS_ERROR",
  GENERATION_ERROR = "GENERATION_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

export interface ErrorHandlingStrategy {
  [ErrorType.UPLOAD_ERROR]: {
    retry: true;
    maxRetries: 3;
    userMessage: "ファイルのアップロードに失敗しました。再試行してください。";
  };
  [ErrorType.ANALYSIS_ERROR]: {
    retry: true;
    maxRetries: 2;
    userMessage: "画像の解析に失敗しました。別の画像をお試しください。";
  };
  [ErrorType.GENERATION_ERROR]: {
    retry: true;
    maxRetries: 2;
    userMessage: "手順の生成に失敗しました。しばらく待ってから再試行してください。";
  };
  [ErrorType.NETWORK_ERROR]: {
    retry: true;
    maxRetries: 5;
    userMessage: "ネットワーク接続を確認してください。";
  };
  [ErrorType.TIMEOUT_ERROR]: {
    retry: false;
    userMessage: "処理に時間がかかりすぎています。画像サイズを小さくしてお試しください。";
  };
}