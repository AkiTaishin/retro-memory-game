import { getRosterSlice } from '../data/cards.js';

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

export function buildDeck(pairCount) {
  const roster = getRosterSlice(pairCount);
  const pairs = roster.flatMap((character, index) => [
    createCard(character, index, 'a'),
    createCard(character, index, 'b'),
  ]);
  return shuffle(pairs);
}

function createCard(character, pairIndex, suffix) {
  return {
    uid: `${character.id}-${suffix}`,
    pairId: character.id,
    pairIndex,
    name: character.name,
    image: character.image,
    faceUp: false,
  };
}

export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function canFlip(state, cardUid) {
  if (state.locked || state.finished) {
    return false;
  }
  const card = state.deck.find((entry) => entry.uid === cardUid);
  if (!card || card.faceUp || state.matched.has(card.pairId)) {
    return false;
  }
  return state.flipped.length < 2;
}

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

export function resolveFlip(state) {
  const next = cloneState(state);
  const [firstUid, secondUid] = next.flipped;
  const first = next.deck.find((entry) => entry.uid === firstUid);
  const second = next.deck.find((entry) => entry.uid === secondUid);
  if (first.pairId === second.pairId) {
    next.matched.add(first.pairId);
    next.flipped = [];
    next.locked = false;
    if (next.matched.size === next.difficulty.pairCount) {
      next.finished = true;
    }
    return { state: next, matched: true };
  }
  first.faceUp = false;
  second.faceUp = false;
  next.flipped = [];
  next.locked = false;
  return { state: next, matched: false };
}

export function getProgress(state) {
  return {
    moves: state.moves,
    matched: state.matched.size,
    total: state.difficulty.pairCount,
  };
}

function cloneState(state) {
  return {
    ...state,
    deck: state.deck.map((card) => ({ ...card })),
    flipped: [...state.flipped],
    matched: new Set(state.matched),
    difficulty: { ...state.difficulty },
  };
}
