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

export const DIFFICULTY = {
  easy: { label: 'EASY', rows: 3, cols: 4, pairCount: 6 },
  normal: { label: 'NORMAL', rows: 4, cols: 4, pairCount: 8 },
};

export function getRosterSlice(pairCount) {
  return ROSTER.slice(0, pairCount);
}
