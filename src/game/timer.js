let intervalId = null;
let startedAt = null;
let elapsedMs = 0;

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

export function getElapsedMs() {
  if (startedAt === null) {
    return elapsedMs;
  }
  return Date.now() - startedAt;
}

export function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
