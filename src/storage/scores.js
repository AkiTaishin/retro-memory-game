const STORAGE_KEY = 'crystal-memory-records';

export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveRecord(difficultyKey, playerName, payload) {
  const records = loadRecords();
  const bucket = records[difficultyKey] ?? [];
  const next = [
    ...bucket,
    {
      playerName,
      moves: payload.moves,
      elapsedMs: payload.elapsedMs,
      savedAt: new Date().toISOString(),
    },
  ]
    .sort((left, right) => {
      if (left.moves !== right.moves) {
        return left.moves - right.moves;
      }
      return left.elapsedMs - right.elapsedMs;
    })
    .slice(0, 5);
  records[difficultyKey] = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

export function getBestRecord(difficultyKey) {
  const records = loadRecords();
  const bucket = records[difficultyKey] ?? [];
  return bucket[0] ?? null;
}

export function getTopRecords(difficultyKey, limit = 5) {
  const records = loadRecords();
  return (records[difficultyKey] ?? []).slice(0, limit);
}
