/**
 * Next.js App Router対応のセッションストレージユーティリティ
 * クライアントサイドでのみ動作し、SSR時は安全にハンドリング
 */

interface SessionData {
  selectedFile?: string;
  selectedMaterial?: string;
}

class SessionStorageManager {
  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  /**
   * セッションデータを安全に保存
   */
  setData(key: keyof SessionData, value: string): void {
    if (!this.isClient()) {
      console.warn("SessionStorage is not available on server side");
      return;
    }

    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to save session data for key: ${key}`, error);
    }
  }

  /**
   * セッションデータを安全に取得
   */
  getData(key: keyof SessionData): string | null {
    if (!this.isClient()) {
      return null;
    }

    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get session data for key: ${key}`, error);
      return null;
    }
  }

  /**
   * 複数のセッションデータを一括保存
   */
  setBatchData(data: SessionData): void {
    if (!this.isClient()) {
      console.warn("SessionStorage is not available on server side");
      return;
    }

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        this.setData(key as keyof SessionData, value);
      }
    });
  }

  /**
   * 複数のセッションデータを一括取得
   */
  getBatchData(keys: (keyof SessionData)[]): Partial<SessionData> {
    if (!this.isClient()) {
      return {};
    }

    const result: Partial<SessionData> = {};
    keys.forEach((key) => {
      const value = this.getData(key);
      if (value !== null) {
        result[key] = value;
      }
    });

    return result;
  }

  /**
   * セッションデータをクリア
   */
  clearData(key: keyof SessionData): void {
    if (!this.isClient()) {
      return;
    }

    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to clear session data for key: ${key}`, error);
    }
  }

  /**
   * 全セッションデータをクリア
   */
  clearAllData(): void {
    if (!this.isClient()) {
      return;
    }

    try {
      sessionStorage.clear();
    } catch (error) {
      console.error("Failed to clear all session data", error);
    }
  }

  /**
   * セッションデータが存在するかチェック
   */
  hasData(key: keyof SessionData): boolean {
    return this.getData(key) !== null;
  }
}

// シングルトンインスタンスをエクスポート
export const sessionStorageManager = new SessionStorageManager();

// 型安全なヘルパー関数
export const saveImageAnalysisSession = (
  file: File,
  material: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        sessionStorageManager.setBatchData({
          selectedFile: reader.result as string,
          selectedMaterial: material,
        });
        resolve();
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
};

export const loadImageAnalysisSession = (): Partial<SessionData> => {
  return sessionStorageManager.getBatchData([
    "selectedFile",
    "selectedMaterial",
  ]);
};

export const clearImageAnalysisSession = (): void => {
  ["selectedFile", "selectedMaterial"].forEach((key) => {
    sessionStorageManager.clearData(key as keyof SessionData);
  });
};
