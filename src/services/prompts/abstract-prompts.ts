/**
 * 抽象画・その他専用プロンプト
 */

// stepTypeベースの新しいプロンプト関数
export function generateAbstractPromptByType(
  stepType: string,
  stepDescription: string
): string {
  switch (stepType) {
    case "background":
      return generateAbstractBackgroundPrompt(stepDescription);
    case "main_part":
      return generateAbstractMainPrompt(stepDescription);
    case "details":
      return generateAbstractDetailsPrompt(stepDescription);
    default:
      return generateGenericAbstractPrompt(stepDescription);
  }
}

function generateAbstractBackgroundPrompt(stepDescription: string): string {
  return `**【重要】抽象画・その他の背景部分のみを塗ってください**

【実行する手順】
"${stepDescription}"

**【背景塗りのルール】**
- **背景のみを塗る**
- **主要要素は白いまま残す**
- **元画像の背景色を正確に観察し、同じ色で塗る**

**重要：背景のみを塗り、主要要素は白いまま残してください。**`;
}

function generateAbstractMainPrompt(stepDescription: string): string {
  return `**【重要】抽象画・その他の主要部分を塗ってください**
アクリル絵の具の質感で書いてください。

【実行する手順】
"${stepDescription}"

**【主要部分塗りのルール】**
- **元画像の色を正確に観察し、同じ色で塗る**
- **指定された部分のみを塗る**
- **全体のバランスを保つ**

**重要：主要部分の色を正確に再現してください。**`;
}

function generateAbstractDetailsPrompt(stepDescription: string): string {
  return `**【重要】抽象画・その他の細部・仕上げを行ってください**

【実行する手順】
"${stepDescription}"

**【細部・仕上げのルール】**
- **細部を丁寧に描き込む**
- **全体のバランスを調整する**
- **元画像の特徴を正確に再現する**

**重要：細部の仕上げを丁寧に行い、元画像の特徴を正確に再現してください。**`;
}

function generateGenericAbstractPrompt(stepDescription: string): string {
  return `**【重要】抽象画・その他の指定された部分を塗ってください**

【実行する手順】
"${stepDescription}"

**【基本ルール】**
- **元画像の色を正確に観察し、同じ色で塗る**
- **指定されていない部分は塗らない**
- **全体のバランスを保つ**

**重要：元画像の色を正確に再現してください。**`;
}

export function generateAbstractPrompt(stepDescription: string): string {
  // 背景・ベース塗り
  if (
    stepDescription.includes("背景") ||
    stepDescription.includes("ベース") ||
    stepDescription.includes("基調")
  ) {
    return `**【緊急重要】背景・ベース領域のみを塗り、詳細要素は絶対に塗らないでください！！！**

🚨 **絶対禁止**: 詳細要素への色塗り
✅ **実行すること**: 背景・ベース領域のみの色塗り

【実行する手順】
"${stepDescription}"

**【背景色の指定 - 最重要】**
- ステップ説明に色名が含まれている場合、その色で背景を塗る
- 色名が明確でない場合は、元画像の背景色を観察して同じ色で塗る

**【背景・ベース塗りのルール】**
- **大まかな領域のみを塗る**
- **細かい要素や詳細は絶対に塗らない**：白黒線画のまま保持
- **黒い輪郭線は一切変更しない**：塗りつぶし厳禁
- **全体の色調を決める重要なステップ**
- **背景全体を均一に塗る**

**【具体的な塗り分け指示】**
- ✅ **塗ってよいもの**：
  - 背景の大まかな色面
  - 基調となる色の領域
  - 大きな色のブロック
- ❌ **絶対に塗らないもの**：
  - 細かいパターンや模様
  - 小さな要素や詳細
  - 複雑な形状

**重要：大まかな背景領域のみを塗り、細かい要素は白黒線画のまま保持してください。この段階では詳細要素への色塗りは行いません。**`;
  }

  // 主要部分塗り・主要要素・形状塗り
  else if (
    stepDescription.includes("主要部分") ||
    stepDescription.includes("メインとなる部分") ||
    stepDescription.includes("主要") ||
    stepDescription.includes("要素") ||
    stepDescription.includes("形状") ||
    stepDescription.includes("パターン") ||
    stepDescription.includes("実際の色で塗る")
  ) {
    return `**【超重要】元画像の主要要素・形状のみを正確な色で塗ってください**

【実行する手順】
"${stepDescription}"

**【主要要素のみ塗るルール】**
- **元画像の主要な形状・パターンを詳細に観察し、同じ色で再現する**
- **背景は白いまま残す**
- **副次的な要素は絶対に塗らない**：白いまま残す

**【具体的な塗り分け指示】**
- ✅ **塗ってよいもの**：
  - 主要な幾何学的形状
  - 中心的なパターン
  - 目立つ色の領域
  - 重要な抽象的要素
- ❌ **絶対に塗らないもの**：
  - 背景
  - 副次的な小さな要素
  - 細かい装飾

**重要：主要要素の形状を正確に塗り、副次要素は次のステップまで白いまま残してください。**`;
  }

  // 副次要素・詳細塗り
  else if (
    stepDescription.includes("副次") ||
    stepDescription.includes("詳細") ||
    stepDescription.includes("装飾") ||
    stepDescription.includes("小要素")
  ) {
    return `**【超重要】副次要素・詳細のみを塗り、主要要素と背景は白いまま残してください**

【実行する手順】
"${stepDescription}"

**【副次要素のみ塗るルール】**
- **小さな要素・装飾・詳細のみを塗る**
- **主要要素・背景は白いまま残す**
- **元画像の色を詳細に観察し、同じ色で再現する**

**【具体的な塗り分け指示】**
- ✅ **塗ってよいもの**：
  - 小さな装飾的要素
  - 副次的なパターン
  - 細かい抽象的詳細
  - アクセント的な色
- ❌ **絶対に塗らないもの**：
  - 主要要素
  - 背景
  - 既に完成した部分

**重要：副次要素・詳細のみを塗り、主要要素は白いまま残してください。**`;
  }

  // グラデーション・色彩効果
  else if (
    stepDescription.includes("グラデーション") ||
    stepDescription.includes("色彩") ||
    stepDescription.includes("効果") ||
    stepDescription.includes("ぼかし")
  ) {
    return `**【超重要】元画像のグラデーション・色彩効果のみを正確に再現してください**

【実行する手順】
"${stepDescription}"

**【色彩効果のみ適用するルール】**
- **元画像のグラデーションや色の変化を詳細に観察し、同じ効果で再現する**
- **既存の形状は変更しない**
- **新しい要素は追加しない**

**【具体的な効果適用指示】**
- ✅ **適用してよいもの**：
  - 色のグラデーション
  - 自然な色の変化
  - ぼかし効果
  - 色彩の調和
- ❌ **絶対にしないもの**：
  - 新しい形状の追加
  - 既存色の大幅な変更
  - 創作的な効果の追加

**重要：元画像の色彩効果のみを再現し、新しい要素は一切追加しないでください。**`;
  }

  // 細部・仕上げ
  else if (
    stepDescription.includes("細部") ||
    stepDescription.includes("仕上げ") ||
    stepDescription.includes("完成") ||
    stepDescription.includes("最終")
  ) {
    return `**【超重要】最小限の細部調整のみを行い、既存の色は絶対に変更しないでください**

この作業は「抽象画の仕上げ・細部調整」の工程です：

【実行する手順】
"${stepDescription}"

**【仕上げの厳格なルール】**
1. **既存の色を保持**：前ステップまでの色は一切変更しない
2. **最小限の調整のみ**：色の境界の調整、微細な色の補正など
3. **元画像に忠実**：元画像にある要素のみ再現
4. **余計な装飾禁止**：創作的な要素は一切追加しない

**【具体的な仕上げ要素】**
- ✅ **調整してよいもの**：
  - 色の境界の微調整
  - 自然な色の馴染み
  - 元画像にある微細な要素
- ❌ **絶対にしないもの**：
  - 創作的な装飾の追加
  - 元画像にない要素の追加
  - 既存色の大幅な変更

**重要：仕上げでは微細な調整のみを行い、既に塗られた色は絶対に変更しないでください。**`;
  }

  // その他の抽象画ステップ（汎用）
  else {
    return `**【最重要】元画像の色を詳細に観察し、100%忠実に再現して段階的に塗り分けてください**

【実行する手順】
"${stepDescription}"

**【抽象画の基本ルール】**
1. **元画像の該当部分を詳細に分析する**
2. **観察した色を一切変更せずに正確に再現する**
3. **このステップで指定された領域のみを塗る**
4. **指定されていない領域は白いまま残す**
5. **抽象的な形状や色の関係性を正確に保持する**

**【抽象画特有の注意点】**
- 形状の境界線を正確に認識する
- 色の関係性や調和を保持する
- 抽象的な表現の意図を尊重する
- 段階的な塗り分けを厳密に守る

**重要：元画像の色を一切変更せず、完全に同じ色でこのステップで指定された範囲のみを塗ってください。**`;
  }
}
