/**
 * 静物・建物画専用プロンプト
 */

// stepTypeベースの新しいプロンプト関数
export function generateStillLifePromptByType(
  stepType: string,
  stepDescription: string
): string {
  switch (stepType) {
    case "background":
      return generateStillLifeBackgroundPrompt(stepDescription);
    case "main_part":
      return generateStillLifeMainPrompt(stepDescription);
    case "details":
      return generateStillLifeDetailsPrompt(stepDescription);
    default:
      return generateGenericStillLifePrompt(stepDescription);
  }
}

function generateStillLifeBackgroundPrompt(stepDescription: string): string {
  return `**【重要】静物・建築画の背景部分のみを塗ってください**

【実行する手順】
"${stepDescription}"

**【背景塗りのルール】**
- **背景のみを塗る**
- **オブジェクト・建物は白いまま残す**
- **元画像の背景色を正確に観察し、同じ色で塗る**

**重要：背景のみを塗り、オブジェクト・建物は白いまま残してください。**`;
}

function generateStillLifeMainPrompt(stepDescription: string): string {
  return `**【重要】静物・建築画の主要部分を塗ってください**
アクリル絵の具の質感で書いてください。

【実行する手順】
"${stepDescription}"

**【主要部分塗りのルール】**
- **元画像の色を正確に観察し、同じ色で塗る**
- **指定された部分のみを塗る**
- **全体のバランスを保つ**

**重要：主要部分の色を正確に再現してください。**`;
}

function generateStillLifeDetailsPrompt(stepDescription: string): string {
  return `**【重要】静物・建築画の細部・仕上げを行ってください**

【実行する手順】
"${stepDescription}"

**【細部・仕上げのルール】**
- **細部を丁寧に描き込む**
- **全体のバランスを調整する**
- **元画像の特徴を正確に再現する**

**重要：細部の仕上げを丁寧に行い、元画像の特徴を正確に再現してください。**`;
}

function generateGenericStillLifePrompt(stepDescription: string): string {
  return `**【重要】静物・建築画の指定された部分を塗ってください**

【実行する手順】
"${stepDescription}"

**【基本ルール】**
- **元画像の色を正確に観察し、同じ色で塗る**
- **指定されていない部分は塗らない**
- **全体のバランスを保つ**

**重要：元画像の色を正確に再現してください。**`;
}

export function generateStillLifePrompt(stepDescription: string): string {
  // 背景塗り
  if (stepDescription.includes("背景") || stepDescription.includes("輪郭外")) {
    return `**【緊急重要】背景のみを塗り、物体・建物部分は絶対に塗らないでください！！！**

🚨 **絶対禁止**: 物体・建物部分への色塗り
✅ **実行すること**: 背景のみの色塗り

【実行する手順】
"${stepDescription}"

**【背景のみ塗る厳格なルール - 最重要】**
1. **物体・建物の輪郭線を境界として認識する**
2. **輪郭線の外側（背景）のみを塗る**
3. **輪郭線の内側（物体・建物）は絶対に塗らない**
4. **黒い輪郭線は一切変更・塗りつぶししない**

**【背景色の指定 - 最重要】**
- ステップ説明に色名が含まれている場合、その色で背景を塗る
- 色名が明確でない場合は、元画像の背景色を観察して同じ色で塗る
- 背景は必ず何らかの色で塗る（白いまま残さない）

**【具体的な塗り分け指示】**
- ✅ **塗ってよいもの（背景のみ）**：
  - 物体・建物の輪郭線の外側の領域
  - 壁や床の背景部分
  - 空や遠景（建物画の場合）
  - 物体の周囲の環境
- ❌ **絶対に塗らないもの（物体・建物）**：
  - 全ての物体・建物の内部
  - 家具や装飾品の内部
  - 構造物の詳細部分
  - 輪郭線で囲まれた全ての領域

**重要：物体・建物の輪郭線を境界として、外側（背景）のみを塗り、内側（物体・建物）は白黒線画のまま保持してください。この段階では物体・建物への色塗りは絶対に行いません。**`;
  }

  // 主要部分塗り・主要物体・建物塗り
  else if (
    stepDescription.includes("主要部分") ||
    stepDescription.includes("メインとなる部分") ||
    stepDescription.includes("主要物体") ||
    stepDescription.includes("主要建物") ||
    stepDescription.includes("メイン") ||
    stepDescription.includes("中心") ||
    stepDescription.includes("実際の色で塗る")
  ) {
    return `**【超重要】主要な物体・建物のみを塗り、副次要素は白いまま残してください**

【実行する手順】
"${stepDescription}"

**【主要要素のみ塗るルール】**
- **最も大きな主要物体・建物のみを塗る**
- **副次物体・装飾は絶対に塗らない**：白いまま残す
- **背景は白いまま残す**
- **元画像の色を詳細に観察し、同じ色で再現する**

**【具体的な塗り分け指示】**
- ✅ **塗ってよいもの**：
  - 最も大きな主要物体
  - メインの建物構造
  - 中心的な家具
- ❌ **絶対に塗らないもの**：
  - 小さな装飾品
  - 副次的な物体
  - 背景要素
  - 細かいディテール

**重要：主要物体・建物のみを塗り、副次要素は次のステップまで白いまま残してください。**`;
  }

  // 副次物体・装飾塗り
  else if (
    stepDescription.includes("副次") ||
    stepDescription.includes("装飾") ||
    stepDescription.includes("小物") ||
    stepDescription.includes("詳細")
  ) {
    return `**【超重要】副次物体・装飾・小物のみを塗り、主要要素と背景は白いまま残してください**

【実行する手順】
"${stepDescription}"

**【副次要素のみ塗るルール】**
- **小さな物体・装飾品・ディテールのみを塗る**
- **主要物体・建物は白いまま残す**
- **背景も白いまま残す**
- **元画像の色を詳細に観察し、同じ色で再現する**

**【具体的な塗り分け指示】**
- ✅ **塗ってよいもの**：
  - 小さな装飾品
  - 副次的な物体
  - 建物の装飾部分
  - 細かいディテール
- ❌ **絶対に塗らないもの**：
  - 主要物体・建物
  - 背景
  - 既に完成した部分

**重要：副次要素・装飾のみを塗り、主要要素は白いまま残してください。**`;
  }

  // 建物構造・建築要素
  else if (
    stepDescription.includes("建物") ||
    stepDescription.includes("建築") ||
    stepDescription.includes("構造") ||
    stepDescription.includes("壁") ||
    stepDescription.includes("屋根")
  ) {
    return `**【超重要】建物の構造要素のみを塗り、装飾や背景は白いまま残してください**

【実行する手順】
"${stepDescription}"

**【建物構造のみ塗るルール】**
- **壁・屋根・柱などの基本構造のみを塗る**
- **装飾や細部は絶対に塗らない**：白いまま残す
- **背景も白いまま残す**
- **元画像の建物色を詳細に観察し、同じ色で再現する**

**【具体的な塗り分け指示】**
- ✅ **塗ってよいもの**：
  - 壁面の基本色
  - 屋根の基本色
  - 柱や梁の構造部分
  - 基本的な建築要素
- ❌ **絶対に塗らないもの**：
  - 窓の装飾
  - ドアの詳細
  - 建築装飾
  - 背景

**重要：建物の基本構造のみを塗り、装飾は次のステップまで白いまま残してください。**`;
  }

  // 細部・仕上げ
  else if (
    stepDescription.includes("細部") ||
    stepDescription.includes("仕上げ") ||
    stepDescription.includes("完成") ||
    stepDescription.includes("最終")
  ) {
    return `**【超重要】最小限の細部描き込みのみを行い、既存の色は絶対に変更しないでください**

この作業は「静物・建物画の仕上げ・細部描き込み」の工程です：

【実行する手順】
"${stepDescription}"

**【仕上げの厳格なルール】**
1. **既存の色を保持**：前ステップまでの色は一切変更しない
2. **最小限の追加のみ**：影、ハイライト、質感の表現など
3. **元画像に忠実**：元画像にある細部のみ再現
4. **余計な装飾禁止**：創作的な要素は一切追加しない

**【具体的な仕上げ要素】**
- ✅ **追加してよいもの**：
  - 自然な影やハイライト
  - 質感の表現
  - 元画像にある細かいディテール
- ❌ **絶対に追加しないもの**：
  - 創作的な装飾
  - 元画像にない要素
  - 既存色の変更

**重要：仕上げでは細部のみを描き込み、既に塗られた色は絶対に変更しないでください。**`;
  }

  // その他の静物・建物ステップ（汎用）
  else {
    return `**【最重要】元画像の色を詳細に観察し、100%忠実に再現して段階的に塗り分けてください**

【実行する手順】
"${stepDescription}"

**【静物・建物画の基本ルール】**
1. **元画像の該当部分を詳細に分析する**
2. **観察した色を一切変更せずに正確に再現する**
3. **このステップで指定された領域のみを塗る**
4. **指定されていない領域は白いまま残す**
5. **物体の境界線を正確に認識する**

**重要：元画像の色を一切変更せず、完全に同じ色でこのステップで指定された範囲のみを塗ってください。**`;
  }
}
