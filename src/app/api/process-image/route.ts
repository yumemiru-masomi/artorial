import { NextRequest, NextResponse } from "next/server";
import sharp, { Kernel } from "sharp";
import { PNG } from "pngjs";
import * as iq from "image-q";

// Laplacian (エッジ強調) カーネル
const laplacian: Kernel = {
  width: 3,
  height: 3,
  kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0],
};

export const runtime = "nodejs"; // Edge不可（sharp使用のため）

export async function POST(req: NextRequest) {
  try {
    // multipart/form-data で画像アップロードを処理
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが必要です" },
        { status: 400 }
      );
    }

    const inputBuf = Buffer.from(await file.arrayBuffer());

    // 画像の基本情報を取得
    const metadata = await sharp(inputBuf).metadata();
    console.log("処理開始:", metadata.width, "x", metadata.height);

    // ---- 1) 線画生成 ----
    console.log("線画生成中...");
    const edgeBuf = await sharp(inputBuf)
      .grayscale()
      .blur(0.7) // 軽くノイズ低減
      .convolve(laplacian) // エッジ抽出
      .threshold(80) // しきい値調整
      .negate() // 黒線化（白地に黒線）
      .toFormat("png")
      .toBuffer();

    // ---- 2) ベタ塗り（減色）----
    console.log("ベタ塗り生成中...");

    // 2-1. 大局的にぼかして細部を落とす（少し改善）
    const softBuf = await sharp(inputBuf)
      .blur(2.5) // 少し強めのブラーで影を薄く
      .modulate({
        brightness: 1.05, // わずかに明るく
      })
      .toFormat("png")
      .toBuffer();

    // 2-2. image-q で減色（8色）
    const png = PNG.sync.read(softBuf);
    const pointContainer = iq.utils.PointContainer.fromUint8Array(
      png.data,
      png.width,
      png.height
    );

    const palette = await iq.buildPalette([pointContainer], {
      colors: 8,
    });

    const quantized = await iq.applyPalette(pointContainer, palette, {
      dithering: 0,
    });

    const quantData = quantized.toUint8Array();
    const flatPng = new PNG({ width: png.width, height: png.height });
    flatPng.data = Buffer.from(quantData);
    const flatBuf = PNG.sync.write(flatPng);

    // ---- 3) 陰影レイヤを抽出して合成（改善版）----
    console.log("陰影付き画像生成中...");

    // より自然な陰影のため、異なるブラー強度を使用
    const blurredBuf = await sharp(inputBuf).blur(6).toFormat("png").toBuffer();

    // 影マスクの生成（改善版：より精密な輝度計算）
    const originalRaw = await sharp(inputBuf)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const blurredRaw = await sharp(blurredBuf)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data: origData, info } = originalRaw;
    const { data: blurData } = blurredRaw;

    // 影マスクを生成
    const shadowMask = Buffer.alloc(info.width * info.height);
    const highlightMask = Buffer.alloc(info.width * info.height);

    for (let i = 0; i < origData.length; i += info.channels) {
      // より正確な輝度計算（人間の視覚に近い重み付け）
      const origLum =
        origData[i] * 0.299 + origData[i + 1] * 0.587 + origData[i + 2] * 0.114;
      const blurLum =
        blurData[i] * 0.299 + blurData[i + 1] * 0.587 + blurData[i + 2] * 0.114;

      const diff = origLum - blurLum;
      const pixelIndex = Math.floor(i / info.channels);

      // より細かいしきい値で自然な陰影
      const shadowThreshold = 20;
      const highlightThreshold = 25;

      if (diff < -shadowThreshold) {
        // 影の強度をグラデーションで表現
        const intensity = Math.min(255, Math.abs(diff) * 3);
        shadowMask[pixelIndex] = intensity;
      } else {
        shadowMask[pixelIndex] = 0;
      }

      if (diff > highlightThreshold) {
        // ハイライトの強度をグラデーションで表現
        const intensity = Math.min(255, diff * 2);
        highlightMask[pixelIndex] = intensity;
      } else {
        highlightMask[pixelIndex] = 0;
      }
    }

    // マスクをPNG形式に変換
    const shadowMaskPng = new PNG({
      width: info.width,
      height: info.height,
      colorType: 0,
    });
    shadowMaskPng.data = shadowMask;
    const shadowMaskBuf = PNG.sync.write(shadowMaskPng);

    const highlightMaskPng = new PNG({
      width: info.width,
      height: info.height,
      colorType: 0,
    });
    highlightMaskPng.data = highlightMask;
    const highlightMaskBuf = PNG.sync.write(highlightMaskPng);

    // ベース画像に陰影を合成（改善版）
    let shadedBuf = await sharp(flatBuf).toBuffer();

    // より自然な影の合成（multiply + opacity調整）
    shadedBuf = await sharp(shadedBuf)
      .composite([
        {
          input: await sharp(inputBuf)
            .modulate({ brightness: 0.7 }) // 影用に暗くした元画像
            .toBuffer(),
          blend: "multiply" as const,
          mask: shadowMaskBuf,
        },
      ])
      .toBuffer();

    // より自然なハイライトの合成（overlay使用）
    shadedBuf = await sharp(shadedBuf)
      .composite([
        {
          input: await sharp(inputBuf)
            .modulate({ brightness: 1.3 }) // ハイライト用に明るくした元画像
            .toBuffer(),
          blend: "overlay" as const,
          mask: highlightMaskBuf,
        },
      ])
      .toBuffer();

    console.log("処理完了");

    // Base64エンコードして返却
    return NextResponse.json({
      success: true,
      results: {
        lineArt: `data:image/png;base64,${edgeBuf.toString("base64")}`,
        flat: `data:image/png;base64,${flatBuf.toString("base64")}`,
        shaded: `data:image/png;base64,${shadedBuf.toString("base64")}`,
      },
    });
  } catch (error) {
    console.error("画像処理エラー:", error);
    return NextResponse.json(
      {
        error: "画像処理中にエラーが発生しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
