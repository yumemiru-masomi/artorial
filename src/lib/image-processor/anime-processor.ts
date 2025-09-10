import sharp from "sharp";

export class AnimeStyleProcessor {
  constructor() {
    // サーバーサイドではSharp.jsのみ使用
  }


  /**
   * 高品質な線画を生成（ステップ1用）
   */
  async createCleanLineArt(inputBuffer: Buffer): Promise<Buffer> {
    try {
      // Sharp.jsで高品質な線画を作成
      const processed = await sharp(inputBuffer)
        .resize(800, 600, { fit: "inside", withoutEnlargement: true })
        .grayscale()
        .normalize()
        // コントラストを強めてエッジを強調
        .linear(1.8, -(128 * 0.8)) // コントラストと明度調整
        .threshold(140) // 二値化の闾値を上げて線を細く
        .negate() // 白背景、黒線に反転
        .jpeg({ quality: 90 })
        .toBuffer();

      return processed;

    } catch (error) {
      console.error("Clean line art creation error:", error);
      throw new Error("線画の生成に失敗しました");
    }
  }

  /**
   * ベタ塗り風画像を生成（ステップ2用）
   */
  async createFlatColors(inputBuffer: Buffer): Promise<Buffer> {
    try {
      // Sharp.jsでアニメ調のベタ塗り風に変換
      const processed = await sharp(inputBuffer)
        .resize(800, 600, { fit: "inside", withoutEnlargement: true })
        // 彩度とコントラストを強めてアニメ調に
        .modulate({
          saturation: 1.4, // 彩度を強める
          brightness: 1.1, // 明度を上げる
        })
        // 軽いブラーで滑らかに
        .blur(1.5)
        // コントラストを強めてベタ塗り風に
        .linear(1.3, -30)
        .jpeg({ quality: 90 })
        .toBuffer();

      return processed;

    } catch (error) {
      console.error("Flat colors creation error:", error);
      throw new Error("ベタ塗りの生成に失敗しました");
    }
  }

  /**
   * ハイライト・陰影を追加（ステップ3用）
   */
  async createHighlights(inputBuffer: Buffer): Promise<Buffer> {
    try {
      // より詳細な陰影とハイライトを追加
      const processed = await sharp(inputBuffer)
        .resize(800, 600, { fit: "inside", withoutEnlargement: true })
        .modulate({
          saturation: 1.2, // 彩度を適度に上げる
          brightness: 1.05, // 明度を少し上げる
        })
        // シャープネスで細部を強調
        .sharpen({
          sigma: 0.8,
          m1: 0.7,
          m2: 3,
          x1: 2,
          y2: 10,
        })
        // コントラストを強めてハイライトと陰影を明確に
        .linear(1.15, -10)
        .jpeg({ quality: 95 })
        .toBuffer();

      return processed;
    } catch (error) {
      console.error("Highlights creation error:", error);
      throw new Error("ハイライト・陰影の生成に失敗しました");
    }
  }

}
