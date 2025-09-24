/**
 * 人物・キャラクター画専用プロンプト
 */

import { generateLineArtPrompt } from "./common-lineart";

// stepTypeベースのシンプルなプロンプト関数（人物・キャラクター用）
export function generateCharacterPromptByType(
  stepType: string,
  stepDescription: string
): string {
  switch (stepType) {
    case "lineart":
      return generateLineArtPrompt();
    case "background":
      return generateBackgroundPrompt(stepDescription);
    case "main_part":
      return generateMainPartPrompt(stepDescription);
    case "details":
      return generateDetailsPrompt(stepDescription);
    default:
      return generateGenericCharacterPrompt(stepDescription);
  }
}

// stepTypeベースのシンプルなプロンプト関数（動物用）
export function generateAnimalPromptByType(
  stepType: string,
  stepDescription: string
): string {
  switch (stepType) {
    case "lineart":
      return generateLineArtPrompt();
    case "background":
      return generateAnimalBackgroundPrompt(stepDescription);
    case "main_part":
      return generateAnimalMainPartPrompt(stepDescription);
    case "details":
      return generateAnimalDetailsPrompt(stepDescription);
    default:
      return generateGenericAnimalPrompt(stepDescription);
  }
}

// 各stepType専用のプロンプト関数
function generateBackgroundPrompt(stepDescription: string): string {
  return `背景のみを塗ってください。キャラクターの線画と形は完全に保持してください

【作業内容】
${stepDescription}

【重要なルール】
1. **キャラクター（人物）の部分** → 白いまま残す（塗らない）
2. **キャラクターの線画・輪郭線** → 黒い線のまま完全に保持する（消さない・薄くしない）
3. **背景の部分のみ** → 元画像と同じ色で塗る
4. **線画の保持** → すべての黒い線（顔・髪・服・手足の輪郭）は鮮明に残す

【絶対に守ること】
- キャラクターの黒い線画は絶対に消さない
- キャラクターの形・輪郭は完全に保持する
- 背景色がキャラクターの線にかからないよう注意深く塗る
- キャラクター内部は白いまま残し、線画のみ黒で保持

重要：背景のみ塗り、キャラクターの線画は鮮明に保持してください。`;
}

function generateMainPartPrompt(stepDescription: string): string {
  return `背景・肌・服・髪のみを塗り、顔のパーツは線画のまま残してください

【実行する手順】
"${stepDescription}"

【塗る部分】
✅ 色を塗るもの：
- 背景：元画像と同じ色で塗る
- 肌：顔・手・腕・足の肌色部分
- 服・衣装：服・靴・靴下・装飾品
- 髪：髪の毛全体

【塗らない部分】
❌ 白黒線画のまま残すもの：
- 目：瞳・まつげ・眉毛
- 鼻：鼻の輪郭線
- 口：唇・口の輪郭線
- 顔の主要パーツ：表情に関わる全ての要素

【質感指定】
全ての色塗り部分はアクリル絵の具の質感で塗ってください。

重要：背景・肌・服・髪のみを塗り、目・鼻・口などの顔のパーツは白黒線画のまま保持してください。アクリル絵の具の質感で仕上げてください。`;
}

function generateDetailsPrompt(stepDescription: string): string {
  return `【超重要】元画像を参照して、細部・仕上げを正確に行ってください
アクリル絵の具の質感で書いてください。

この作業は「キャラクター画の細部・仕上げ」の工程です：

【実行する手順】
"${stepDescription}"

【細部・仕上げのルール】
- 目・鼻・口などの顔の細部を描き込む
- 影・ハイライト・質感を追加する
- 全体のバランスを調整する

重要：細部を丁寧に描き込み、全体の完成度を高めてください。`;
}

function generateGenericCharacterPrompt(stepDescription: string): string {
  return `【重要】元画像を参照して、指定された部分を正確な色で塗ってください

【実行する手順】
"${stepDescription}"

【基本ルール】
- 元画像の色を正確に観察し、同じ色で塗る
- 指定されていない部分は塗らない
- 全体のバランスを保つ

【質感指定】
全ての色塗り部分はアクリル絵の具の質感で塗ってください。

重要：元画像の色を正確に再現してください。`;
}

// 動物画専用のプロンプト関数
function generateAnimalBackgroundPrompt(stepDescription: string): string {
  return `
背景のみを塗ってください。動物の線画と形は完全に保持してください。
アクリル絵の具の質感で書いてください。

【作業内容】
${stepDescription}

【ルール】
1. 動物の部分 → 白いまま残す
2. 動物の線画・輪郭線 → 黒い線のまま完全に保持する（消さない・薄くしない）
3. 背景の部分のみ → 元画像と同じ色で塗る
4. 動物の輪郭線は変更しない
5. 白い毛並みの動物もいるから、背景と間違えないように注意する

重要：背景のみ塗り、動物の線画は鮮明に保持してください。

【質感指定】
全ての色塗り部分はアクリル絵の具の質感で塗ってください。`;
}

function generateAnimalMainPartPrompt(stepDescription: string): string {
  return `【シンプル塗り】背景・動物の毛色・模様のみを塗り、目・鼻・口などの細部は線画のまま残してください

【実行する手順】
"${stepDescription}"

【塗る部分】
✅ 色を塗るもの：
- 背景：元画像と同じ色で塗る
- 動物の体：毛・羽・皮膚の基本色
- 模様・マーキング：斑点・縞模様・特徴的な色の部分
- 尻尾・耳・足：動物の主要な体の部分

【塗らない部分】
❌ 白黒線画のまま残すもの：
- 目：瞳・まつげ・目の周り
- 鼻：鼻の輪郭線・鼻孔
- 口：口の輪郭線・歯
- 細部の表情：表情に関わる全ての要素

【質感指定】
全ての色塗り部分はアクリル絵の具の質感で塗ってください。

重要：背景・動物の基本的な毛色・模様のみを塗り、目・鼻・口などの表情パーツは白黒線画のまま保持してください。アクリル絵の具の質感で仕上げてください。`;
}

function generateAnimalDetailsPrompt(stepDescription: string): string {
  return `【超重要】元画像を参照して、動物の細部・仕上げを正確に行ってください
アクリル絵の具の質感で書いてください。

この作業は「動物画の細部・仕上げ」の工程です：

【実行する手順】
"${stepDescription}"

【細部・仕上げのルール】
- 目・鼻・口などの動物の表情を描き込む
- 毛の質感・羽の細部・鱗の模様を追加する
- 影・ハイライト・立体感を表現する
- 全体のバランスを調整する

【質感指定】
全ての色塗り部分はアクリル絵の具の質感で塗ってください。

重要：動物の特徴的な表情と質感を丁寧に描き込み、全体の完成度を高めてください。`;
}

function generateGenericAnimalPrompt(stepDescription: string): string {
  return `【重要】元画像を参照して、動物の指定された部分を正確な色で塗ってください

【実行する手順】
"${stepDescription}"

【基本ルール】
- 元画像の色を正確に観察し、同じ色で塗る
- 動物の自然な毛色・模様を再現する
- 指定されていない部分は塗らない
- 全体のバランスを保つ

【質感指定】
全ての色塗り部分はアクリル絵の具の質感で塗ってください。

重要：元画像の動物の色と特徴を正確に再現してください。`;
}

// 動物用の汎用プロンプト関数
export function generateAnimalPrompt(stepDescription: string): string {
  return generateGenericAnimalPrompt(stepDescription);
}

// 旧関数（後方互換性のため残存）- 将来削除予定
export function generateCharacterPrompt(stepDescription: string): string {
  return generateGenericCharacterPrompt(stepDescription);
}
