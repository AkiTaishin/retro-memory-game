/**
 * メンター用コメント付きソース（受講者には配布しない）
 * 対応ファイル: src/data/cards.js
 *
 * 責務: キャラクター定義と難易度設定（データ層）
 * UI やゲームロジックは含まない。定数の切り出し例として説明しやすい。
 */

// 神経衰弱に使うキャラクター一覧（8 体まで定義、難易度で使う枚数を変える）
export const ROSTER = [
  { id: 'wizard', name: 'WIZARD', image: '/sprites/Wizard.png' },
  { id: 'bowman', name: 'ARCHER', image: '/sprites/bowman.png' },
  { id: 'paladin', name: 'PALADIN', image: '/sprites/paladin.png' },
  { id: 'warrior', name: 'WARRIOR', image: '/sprites/warrior2.png' },
  { id: 'boar', name: 'BOAR', image: '/sprites/boar.png' },
  { id: 'giant', name: 'GIANT', image: '/sprites/giant.png' },
  { id: 'octopus', name: 'KRAKEN', image: '/sprites/octopus.png' },
  { id: 'yeti', name: 'YETI', image: '/sprites/yeti.png' },
];

// 難易度ごとのグリッドサイズとペア数
// pairCount = 使用キャラ数 = カード総数 / 2
export const DIFFICULTY = {
  easy: { label: 'EASY', rows: 3, cols: 4, pairCount: 6 },   // 3×4 = 12 枚
  normal: { label: 'NORMAL', rows: 4, cols: 4, pairCount: 8 }, // 4×4 = 16 枚
};

/**
 * 先頭 pairCount 件だけロスターから取り出す
 * slice により元配列 ROSTER は変更されない（イミュータブルな取り出し）
 */
export function getRosterSlice(pairCount) {
  return ROSTER.slice(0, pairCount);
}
