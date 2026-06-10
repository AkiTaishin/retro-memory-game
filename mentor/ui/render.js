/**
 * メンター用コメント付きソース（受講者には配布しない）
 * 対応ファイル: src/ui/render.js
 *
 * 責務: DOM の生成（テンプレート文字列 + innerHTML）
 * 状態を受け取り HTML を返す／描画する。イベント登録は events.js が担当。
 */

import { DIFFICULTY } from '../data/cards.js';
import { formatElapsed } from '../game/timer.js';
import { getTopRecords } from '../storage/scores.js';

/** タイトル画面（名前入力・難易度選択・ランキング） */
export function renderStartScreen(root, playerName) {
  root.innerHTML = `
    <div class="scene start-scene">
      <div class="window window-title">
        <p class="eyebrow">- QUEST START -</p>
        <h1>CRYSTAL<br />MEMORY</h1>
        <p class="subtitle">Find the matching allies & monsters!</p>
      </div>
      <div class="window window-form">
        <label class="field">
          <span class="field-label">HERO NAME</span>
          <input id="player-name" type="text" maxlength="12" value="${escapeHtml(playerName)}" autocomplete="off" />
        </label>
        <fieldset class="difficulty-fieldset">
          <legend class="field-label">DIFFICULTY</legend>
          <div class="difficulty-options">
            ${Object.entries(DIFFICULTY)
              .map(
                ([key, value]) => `
                  <label class="difficulty-option">
                    <input type="radio" name="difficulty" value="${key}" ${key === 'easy' ? 'checked' : ''} />
                    <span>${value.label}</span>
                    <small>${value.rows} x ${value.cols}</small>
                  </label>
                `,
              )
              .join('')}
          </div>
        </fieldset>
        <button id="start-button" class="btn-primary">▶ START QUEST</button>
      </div>
      <div class="window window-records">
        <p class="field-label">HALL OF FAME</p>
        ${renderRecordsPanel()}
      </div>
    </div>
  `;
}

/**
 * プレイ画面（HUD + ボード + クリア時オーバーレイ）
 * state.deck からカード HTML を map で生成
 * faceUp → is-flipped、matched → is-matched クラスで CSS アニメーション
 */
export function renderGameScreen(root, context) {
  const { state, playerName, elapsedMs } = context;
  const { moves, matched, total } = context.progress;
  root.innerHTML = `
    <div class="scene game-scene">
      <div class="window window-hud">
        <div class="hud-grid">
          <div><span class="hud-label">HERO</span><span class="hud-value">${escapeHtml(playerName)}</span></div>
          <div><span class="hud-label">TIME</span><span class="hud-value" id="timer-display">${formatElapsed(elapsedMs)}</span></div>
          <div><span class="hud-label">MOVES</span><span class="hud-value" id="moves-display">${moves}</span></div>
          <div><span class="hud-label">FOUND</span><span class="hud-value" id="found-display">${matched}/${total}</span></div>
        </div>
      </div>
      <div class="window window-board">
        <div
          class="board"
          style="--board-cols: ${state.difficulty.cols}; --board-rows: ${state.difficulty.rows};"
          id="board"
        >
          ${state.deck
            .map((card) => {
              const classes = ['card'];
              if (card.faceUp) classes.push('is-flipped');
              if (state.matched.has(card.pairId)) classes.push('is-matched');
              return `
                <button
                  class="${classes.join(' ')}"
                  type="button"
                  data-uid="${card.uid}"
                  aria-label="${card.faceUp || state.matched.has(card.pairId) ? card.name : 'Hidden card'}"
                >
                  <span class="card-inner">
                    <span class="card-face card-back"></span>
                    <span class="card-face card-front">
                      <img src="${card.image}" alt="${card.name}" draggable="false" />
                      <span class="card-caption">${card.name}</span>
                    </span>
                  </span>
                </button>
              `;
            })
            .join('')}
        </div>
      </div>
      <div class="window window-actions">
        <button id="quit-button" class="btn-secondary">← BACK TO TITLE</button>
      </div>
      ${state.finished ? renderResultOverlay(context) : ''}
    </div>
  `;
}

/**
 * HUD の部分更新（タイマー interval から呼ばれる）
 * ボード全体の再生成を避け、TIME/MOVES/FOUND だけ更新
 */
export function updateHud(progress, elapsedMs) {
  const timerDisplay = document.getElementById('timer-display');
  const movesDisplay = document.getElementById('moves-display');
  const foundDisplay = document.getElementById('found-display');
  if (timerDisplay) timerDisplay.textContent = formatElapsed(elapsedMs);
  if (movesDisplay) movesDisplay.textContent = String(progress.moves);
  if (foundDisplay) foundDisplay.textContent = `${progress.matched}/${progress.total}`;
}

/** クリア時のオーバーレイ。saved は saveRecord の成否 */
function renderResultOverlay(context) {
  const { playerName, progress, elapsedMs, bestRecord, saved } = context;
  const bestLine = bestRecord
    ? `BEST ${bestRecord.moves} MOVES / ${formatElapsed(bestRecord.elapsedMs)}`
    : 'NO RECORD YET';
  return `
    <div class="overlay" id="result-overlay">
      <div class="window window-result">
        <p class="eyebrow">- QUEST CLEAR -</p>
        <h2>VICTORY!</h2>
        <p class="result-line">HERO: ${escapeHtml(playerName)}</p>
        <p class="result-line">TIME: ${formatElapsed(elapsedMs)}</p>
        <p class="result-line">MOVES: ${progress.moves}</p>
        <p class="result-note">${saved ? 'NEW RECORD SAVED!' : 'RECORD NOT UPDATED'}</p>
        <p class="result-best">${bestLine}</p>
        <div class="result-actions">
          <button id="retry-button" class="btn-primary">↻ PLAY AGAIN</button>
          <button id="title-button" class="btn-secondary">⌂ TITLE</button>
        </div>
      </div>
    </div>
  `;
}

/** タイトル画面の難易度別ランキング（最大 3 件表示） */
function renderRecordsPanel() {
  return Object.entries(DIFFICULTY)
    .map(([key, value]) => {
      const records = getTopRecords(key, 3);
      if (records.length === 0) {
        return `<div class="record-block"><p class="record-title">${value.label}</p><p class="record-empty">---</p></div>`;
      }
      const lines = records
        .map(
          (record, index) =>
            `<li>${index + 1}. ${escapeHtml(record.playerName)} ${record.moves}M ${formatElapsed(record.elapsedMs)}</li>`,
        )
        .join('');
      return `<div class="record-block"><p class="record-title">${value.label}</p><ol class="record-list">${lines}</ol></div>`;
    })
    .join('');
}

/**
 * XSS 対策: ユーザー入力（プレイヤー名）を HTML に埋め込む前にエスケープ
 * 教材ポイント: innerHTML 使用時は必ずサニタイズが必要
 */
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
