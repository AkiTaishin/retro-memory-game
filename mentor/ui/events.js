/**
 * メンター用コメント付きソース（受講者には配布しない）
 * 対応ファイル: src/ui/events.js
 *
 * 責務: 画面遷移・ユーザー操作・各モジュールの接続（コントローラ層）
 *
 * 論点 A: paintBoard / renderGameScreen によりカード操作のたびに
 * 画面全体を innerHTML で再生成している。部分更新とのトレードオフを議論可能。
 */

import { DIFFICULTY } from '../data/cards.js';
import {
  canFlip,
  createInitialState,
  flipCard,
  getProgress,
  resolveFlip,
} from '../game/engine.js';
import { getElapsedMs, resetTimer, startTimer, stopTimer } from '../game/timer.js';
import { getBestRecord, saveRecord } from '../storage/scores.js';
import { renderGameScreen, renderStartScreen, updateHud } from './render.js';

// 不一致時、カードを裏返すまでの待ち時間（ミリ秒）
const FLIP_DELAY_MS = 700;

/**
 * 画面コントローラのファクトリ
 * クロージャで playerName / difficultyKey / state / タイマー ID を保持
 */
export function createScreenController(root) {
  let playerName = 'HERO';
  let difficultyKey = 'easy';
  let state = null;
  let hudTimerId = null; // HUD 更新用 interval（論点 B: timer.js と二重）

  function showStart() {
    cleanupGameTimers();
    resetTimer();
    state = null;
    renderStartScreen(root, playerName);
    bindStartScreen();
  }

  function beginGame() {
    const difficulty = DIFFICULTY[difficultyKey];
    state = createInitialState(difficulty);
    cleanupGameTimers();
    resetTimer();
    renderGameScreen(root, buildViewContext(false));
    bindGameScreen();
    startTimer();
    // 250ms ごとに HUD だけ更新（ボードは再生成しない）
    hudTimerId = window.setInterval(() => {
      updateHud(getProgress(state), getElapsedMs());
    }, 250);
  }

  function bindStartScreen() {
    const nameInput = root.querySelector('#player-name');
    root.querySelector('#start-button')?.addEventListener('click', () => {
      const trimmed = nameInput?.value.trim() ?? '';
      playerName = trimmed.length > 0 ? trimmed : 'HERO';
      const selected = root.querySelector('input[name="difficulty"]:checked');
      difficultyKey = selected?.value ?? 'easy';
      beginGame();
    });
  }

  function bindGameScreen() {
    // イベント委譲: ボード全体に 1 リスナー。closest でカード button を特定
    root.querySelector('#board')?.addEventListener('click', (event) => {
      const target = event.target.closest('[data-uid]');
      if (!target) return;
      handleCardClick(target.dataset.uid);
    });

    root.querySelector('#quit-button')?.addEventListener('click', showStart);
    root.querySelector('#retry-button')?.addEventListener('click', beginGame);
    root.querySelector('#title-button')?.addEventListener('click', showStart);
  }

  /**
   * カードクリックのメインフロー
   * 1. flipCard → 2. 再描画 → 3. 2 枚なら setTimeout → resolveFlip
   */
  function handleCardClick(cardUid) {
    if (!state || !canFlip(state, cardUid)) {
      return;
    }

    state = flipCard(state, cardUid);
    paintBoard();
    updateHud(getProgress(state), getElapsedMs());

    if (state.flipped.length !== 2) {
      return;
    }

    // プレイヤーが 2 枚目を確認できるよう FLIP_DELAY_MS 待ってから判定
    window.setTimeout(() => {
      const result = resolveFlip(state);
      state = result.state;

      if (state.finished) {
        finishGame();
        return;
      }

      paintBoard();
      updateHud(getProgress(state), getElapsedMs());
    }, FLIP_DELAY_MS);
  }

  function finishGame() {
    cleanupGameTimers();
    const elapsedMs = getElapsedMs();
    const progress = getProgress(state);
    const saved = saveRecord(difficultyKey, playerName, {
      moves: progress.moves,
      elapsedMs,
    });
    renderGameScreen(root, buildViewContext(saved));
    bindGameScreen();
  }

  /**
   * ボード状態を反映するためゲーム画面を丸ごと再描画（論点 A）
   * 再描画のたび bindGameScreen でイベントを付け直す必要がある
   */
  function paintBoard() {
    renderGameScreen(root, buildViewContext(false));
    bindGameScreen();
  }

  function buildViewContext(saved) {
    return {
      state,
      playerName,
      progress: getProgress(state),
      elapsedMs: getElapsedMs(),
      bestRecord: getBestRecord(difficultyKey),
      saved,
    };
  }

  function cleanupGameTimers() {
    stopTimer();
    if (hudTimerId !== null) {
      window.clearInterval(hudTimerId);
      hudTimerId = null;
    }
  }

  return {
    showStart,
    cleanup: cleanupGameTimers,
  };
}
