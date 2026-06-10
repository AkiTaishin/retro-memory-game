/**
 * メンター用コメント付きソース（受講者には配布しない）
 * 対応ファイル: src/game/timer.js
 *
 * 責務: ゲーム経過時間の計測と表示フォーマット
 *
 * 論点 B: ui/events.js 側にも HUD 更新用 setInterval がある。
 * タイマー本体（250ms 更新）と HUD 描画（250ms 更新）が二重管理になっている。
 * 「1 本にまとめるべきか」をメンターが議論できる。
 */

// モジュールスコープのプライベート変数（export しない）
let intervalId = null;
let startedAt = null;
let elapsedMs = 0;

/** 計測開始。再開時は stop してからリセット */
export function startTimer() {
  stopTimer();
  startedAt = Date.now();
  elapsedMs = 0;
  intervalId = window.setInterval(() => {
    elapsedMs = Date.now() - startedAt;
  }, 250);
}

export function stopTimer() {
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

export function resetTimer() {
  stopTimer();
  startedAt = null;
  elapsedMs = 0;
}

/** 現在の経過ミリ秒。計測中は Date.now() から都度計算 */
export function getElapsedMs() {
  if (startedAt === null) {
    return elapsedMs;
  }
  return Date.now() - startedAt;
}

/** "MM:SS" 形式に整形（HUD・結果画面で共用） */
export function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
