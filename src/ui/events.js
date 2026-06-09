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

const FLIP_DELAY_MS = 700;

export function createScreenController(root) {
  let playerName = 'HERO';
  let difficultyKey = 'easy';
  let state = null;
  let hudTimerId = null;

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
    root.querySelector('#board')?.addEventListener('click', (event) => {
      const target = event.target.closest('[data-uid]');
      if (!target) return;
      handleCardClick(target.dataset.uid);
    });

    root.querySelector('#quit-button')?.addEventListener('click', showStart);
    root.querySelector('#retry-button')?.addEventListener('click', beginGame);
    root.querySelector('#title-button')?.addEventListener('click', showStart);
  }

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
