/**
 * メンター用コメント付きソース（受講者には配布しない）
 * 対応ファイル: src/storage/scores.js
 *
 * 責務: ベスト記録の localStorage 永続化
 * 防御的プログラミング: try/catch でプライベートモード等の失敗を吸収
 */

const STORAGE_KEY = 'crystal-memory-records';

/** 全難易度の記録を読み込み。失敗時は空オブジェクト */
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

/**
 * 1 件追加してソートし、各難易度最大 5 件を保持
 * @returns {boolean} 保存成功なら true
 *
 * ソート基準: moves 昇順 → 同 moves なら elapsedMs 昇順
 */
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

/** 難易度別の 1 位記録（結果画面の BEST 表示用） */
export function getBestRecord(difficultyKey) {
  const records = loadRecords();
  const bucket = records[difficultyKey] ?? [];
  return bucket[0] ?? null;
}

/** タイトル画面 HALL OF FAME 用。上位 limit 件 */
export function getTopRecords(difficultyKey, limit = 5) {
  const records = loadRecords();
  return (records[difficultyKey] ?? []).slice(0, limit);
}
