/**
 * メンター用コメント付きソース（受講者には配布しない）
 * 対応ファイル: src/game/engine.js
 *
 * 責務: ゲームルールと状態遷移（UI 非依存のコアロジック）
 * DOM 操作は一切しない。テストしやすい層として設計されている。
 */

import { getRosterSlice } from '../data/cards.js';

/**
 * 新規ゲームの初期状態を生成
 * - deck: シャッフル済みカード配列
 * - flipped: 現在めくられているカード uid（最大 2 件）
 * - matched: ペア成立済みの pairId を Set で管理
 * - locked: 2 枚めくった直後、判定待ち中は true（クリック不可）
 */
export function createInitialState(difficulty) {
  const deck = buildDeck(difficulty.pairCount);
  return {
    deck,
    flipped: [],
    matched: new Set(),
    moves: 0,
    locked: false,
    finished: false,
    difficulty,
  };
}

/** ロスターからペアを 2 枚ずつ複製し、シャッフルしてデッキを作る */
export function buildDeck(pairCount) {
  const roster = getRosterSlice(pairCount);
  // flatMap: 各キャラに対し a/b の 2 枚カードを生成して 1 次元配列に flatten
  const pairs = roster.flatMap((character, index) => [
    createCard(character, index, 'a'),
    createCard(character, index, 'b'),
  ]);
  return shuffle(pairs);
}

/** 1 枚分のカードオブジェクト。uid は DOM の data-uid と対応 */
function createCard(character, pairIndex, suffix) {
  return {
    uid: `${character.id}-${suffix}`,
    pairId: character.id, // ペア判定に使う（a/b で同じ id）
    pairIndex,
    name: character.name,
    image: character.image,
    faceUp: false,
  };
}

/**
 * Fisher-Yates 風シャッフル（論点 C）
 * - 元配列 items は変更せず、コピー copy をシャッフルして返す
 * - sort(() => Math.random() - 0.5) との偏りの違いを 4 日目以降で議論可能
 */
export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 指定カードをめくれるか判定（クリック可否の唯一の入口） */
export function canFlip(state, cardUid) {
  if (state.locked || state.finished) {
    return false;
  }
  const card = state.deck.find((entry) => entry.uid === cardUid);
  // 既に表向き、またはマッチ済みペアのカードは不可
  if (!card || card.faceUp || state.matched.has(card.pairId)) {
    return false;
  }
  // 3 枚目をめくらない（flipped は最大 2 件）
  return state.flipped.length < 2;
}

/**
 * カードを 1 枚めくる（イミュータブル更新）
 * 2 枚目をめくった時点で moves++ かつ locked = true
 */
export function flipCard(state, cardUid) {
  const next = cloneState(state);
  const card = next.deck.find((entry) => entry.uid === cardUid);
  if (!canFlip(next, cardUid)) {
    return next;
  }
  card.faceUp = true;
  next.flipped = [...next.flipped, cardUid];
  if (next.flipped.length === 2) {
    next.moves += 1;
    next.locked = true;
  }
  return next;
}

/**
 * 2 枚めくり後のペア判定
 * @returns {{ state, matched: boolean }} matched=true ならペア成立
 */
export function resolveFlip(state) {
  const next = cloneState(state);
  const [firstUid, secondUid] = next.flipped;
  const first = next.deck.find((entry) => entry.uid === firstUid);
  const second = next.deck.find((entry) => entry.uid === secondUid);
  if (first.pairId === second.pairId) {
    next.matched.add(first.pairId);
    next.flipped = [];
    next.locked = false;
    // 全ペア揃いでクリア
    if (next.matched.size === next.difficulty.pairCount) {
      next.finished = true;
    }
    return { state: next, matched: true };
  }
  // 不一致: 表向きを戻す（UI 側の setTimeout 後に呼ばれる）
  first.faceUp = false;
  second.faceUp = false;
  next.flipped = [];
  next.locked = false;
  return { state: next, matched: false };
}

/** HUD 表示用の進捗サマリー */
export function getProgress(state) {
  return {
    moves: state.moves,
    matched: state.matched.size,
    total: state.difficulty.pairCount,
  };
}

/**
 * 状態の深いコピー
 * deck 内の各カード、flipped 配列、matched Set を複製
 * 直接 mutate しない設計 → デバッグ時に state の変化を追いやすい
 */
function cloneState(state) {
  return {
    ...state,
    deck: state.deck.map((card) => ({ ...card })),
    flipped: [...state.flipped],
    matched: new Set(state.matched),
    difficulty: { ...state.difficulty },
  };
}
