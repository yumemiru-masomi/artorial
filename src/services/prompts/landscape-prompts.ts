/**
 * 風景画専用プロンプト
 */

// stepTypeベースの新しいプロンプト関数
export function generateLandscapePromptByType(
  stepType: string,
  stepDescription: string
): string {
  console.log(`🏞️ 風景画プロンプト（stepType: ${stepType}）`);

  switch (stepType) {
    case "background":
      return generateLandscapeBackgroundPrompt(stepDescription);
    case "main_part":
      return generateLandscapeMainPrompt(stepDescription);
    case "details":
      return generateLandscapeDetailsPrompt(stepDescription);
    default:
      console.log(`⚠️ 未知のstepType: ${stepType}, 汎用プロンプト使用`);
      return generateGenericLandscapePrompt(stepDescription);
  }
}

function generateLandscapeBackgroundPrompt(stepDescription: string): string {
  return `**【重要】風景画の背景部分のみを塗ってください**

【実行する手順】
"${stepDescription}"

**【背景塗りのルール】**
- **背景（空・遠景）のみを塗る**
- **前景・中景は白いまま残す**
- **元画像の背景色を正確に観察し、同じ色で塗る**

**重要：背景のみを塗り、他の部分は白いまま残してください。**`;
}

function generateLandscapeMainPrompt(stepDescription: string): string {
  return `**【重要】風景画の主要部分を塗ってください**

【実行する手順】
"${stepDescription}"

**【主要部分塗りのルール】**
- **元画像の色を正確に観察し、同じ色で塗る**
- **指定された部分のみを塗る**
- **全体のバランスを保つ**

**重要：主要部分の色を正確に再現してください。**`;
}

function generateLandscapeDetailsPrompt(stepDescription: string): string {
  return `**【重要】風景画の細部・仕上げを行ってください**

【実行する手順】
"${stepDescription}"

**【細部・仕上げのルール】**
- **細部を丁寧に描き込む**
- **全体のバランスを調整する**
- **元画像の特徴を正確に再現する**

**重要：細部の仕上げを丁寧に行い、元画像の特徴を正確に再現してください。**`;
}

function generateGenericLandscapePrompt(stepDescription: string): string {
  return `**【重要】風景画の指定された部分を塗ってください**

【実行する手順】
"${stepDescription}"

**【基本ルール】**
- **元画像の色を正確に観察し、同じ色で塗る**
- **指定されていない部分は塗らない**
- **全体のバランスを保つ**

**重要：元画像の色を正確に再現してください。**`;
}

export function generateLandscapePrompt(stepDescription: string): string {
  console.log("🌅 風景画専用プロンプト");

  // 背景・遠景（空・山など）
  if (
    stepDescription.includes("背景") ||
    stepDescription.includes("遠景") ||
    stepDescription.includes("空") ||
    stepDescription.includes("上部")
  ) {
    console.log("✅ 風景画背景・遠景専用プロンプト");
    return `**【緊急重要】画像の上部（空・遠景）のみを塗り、下部は絶対に塗らないでください！！！**

🚨 **絶対禁止**: 下部要素への色塗り
✅ **実行すること**: 上部（背景・遠景）のみの色塗り

この作業は「風景画の上下分割塗り - 上部のみ」の工程です：

【実行する手順】
"${stepDescription}"

**【上部のみ塗るルール】**
- **画像の上半分～上部2/3のみを塗る**：空、遠景の山、雲など
- **画像の下部は絶対に塗らない**：水面、前景、植物は白黒線画のまま保持
- **水平線を境界として明確に区別する**
- **黒い輪郭線は一切変更しない**：塗りつぶし厳禁

**【具体的な塗り分け指示】**
- ✅ **塗ってよいもの（上部のみ）**：
  - 空の部分全体
  - 遠景の山や丘
  - 雲や大気の表現
  - 背景の建物（上部にある場合）
- ❌ **絶対に塗らないもの（下部）**：
  - 水面や池の部分
  - 前景の植物や物体
  - 画像下半分の全ての要素

**【背景色の指定 - 最重要】**
- ステップ説明に色名が含まれている場合、その色で背景を塗る
- 色名が明確でない場合は、元画像の背景色を観察して同じ色で塗る
- 背景は必ず何らかの色で塗る（白いまま残さない）

**【風景画上下分割の厳格なルール】**
1. 画像を水平に上下分割して認識する
2. 上部（空・遠景）のみを塗る
3. 下部（水面・前景）は次のステップまで白いまま
4. 境界線は水平線や地平線を基準にする
5. 背景全体を均一に塗る

**重要：画像を上下に分割し、このステップでは上部（空・遠景）のみを塗り、下部は白いまま残してください。**`;
  }

  // 主要部分塗り・前景・水面（下部）
  else if (
    stepDescription.includes("主要部分") ||
    stepDescription.includes("メイン") ||
    stepDescription.includes("メインとなる部分") ||
    stepDescription.includes("前景") ||
    stepDescription.includes("水面") ||
    stepDescription.includes("下部") ||
    stepDescription.includes("植生") ||
    stepDescription.includes("実際の色で塗る")
  ) {
    console.log("✅ 風景画前景・水面専用プロンプト");
    return `**【超重要】画像の下部（水面・前景）のみを塗り、上部は白いまま残してください**

この作業は「風景画の上下分割塗り - 下部のみ」の工程です：

【実行する手順】
"${stepDescription}"

**【下部のみ塗るルール】**
- **画像の下半分～下部2/3のみを塗る**：水面、前景、植物など
- **画像の上部は絶対に塗らない**：空や遠景は白いまま
- **水平線を境界として明確に区別する**

**【具体的な塗り分け指示】**
- ✅ **塗ってよいもの（下部のみ）**：
  - 水面や池の部分
  - 前景の植物や花
  - 岩や地面の表現
  - 前景の建物や物体
- ❌ **絶対に塗らないもの（上部）**：
  - 空の部分（白いまま残す）
  - 遠景の山や雲（白いまま残す）

**重要：下部（水面・前景）のみを塗り、上部は白いまま残してください。**`;
  }

  // 中景・主要要素
  else if (
    stepDescription.includes("中景") ||
    stepDescription.includes("主要") ||
    stepDescription.includes("建物") ||
    stepDescription.includes("木")
  ) {
    console.log("✅ 風景画中景専用プロンプト");
    return `**【超重要】元画像を参照して、中景の主要要素のみを正確な色で塗ってください**

この作業は「風景画の中景・主要要素塗り」の工程です：

【実行する手順】
"${stepDescription}"

**【中景のみ塗るルール】**
- **元画像の中景部分を詳細に観察し、同じ色で主要要素を塗る**
- **背景と前景は白いまま残す**
- **主要な建物・木・橋などの構造物のみを塗る**

**【具体的な塗り分け指示】**
- ✅ **塗ってよいもの**：
  - 中景の建物や構造物
  - 主要な木や植物
  - 橋や道路
  - 中景の岩や地形
- ❌ **絶対に塗らないもの**：
  - 背景（空・遠景）
  - 前景の細かい要素
  - 水面の反射

**重要：中景の主要要素のみを塗り、背景と前景は白いまま残してください。**`;
  }

  // 細部・仕上げ
  else if (
    stepDescription.includes("細部") ||
    stepDescription.includes("仕上げ") ||
    stepDescription.includes("詳細") ||
    stepDescription.includes("完成")
  ) {
    console.log("✅ 風景画仕上げ専用プロンプト");
    return `**【超重要】最小限の細部描き込みのみを行い、既存の色は絶対に変更しないでください**

この作業は「風景画の仕上げ・細部描き込み」の工程です：

【実行する手順】
"${stepDescription}"

**【仕上げの厳格なルール】**
1. **既存の色を保持**：前ステップまでの色は一切変更しない
2. **最小限の追加のみ**：細かい葉っぱ、波紋、雲の質感など
3. **元画像に忠実**：元画像にある細部のみ再現
4. **余計な装飾禁止**：創作的な要素は一切追加しない

**重要：仕上げでは細部のみを描き込み、既に塗られた色は絶対に変更しないでください。**`;
  }

  // その他の風景ステップ（汎用）
  else {
    console.log("✅ 風景画汎用プロンプト");
    return `**【最重要】元画像の色を詳細に観察し、100%忠実に再現して段階的に塗り分けてください**

【実行する手順】
"${stepDescription}"

**【風景画の基本ルール】**
1. **元画像の該当部分を詳細に分析する**
2. **観察した色を一切変更せずに正確に再現する**
3. **このステップで指定された領域のみを塗る**
4. **指定されていない領域は白いまま残す**
5. **自然な境界線を意識する**

**重要：元画像の色を一切変更せず、完全に同じ色でこのステップで指定された範囲のみを塗ってください。**`;
  }
}
