// Five hidden bipolar desire axes shared by analysis, simulation and results.
export const AXES = Object.freeze([
  Object.freeze({ key: 'domination', name: '支配', englishName: 'Domination', label: '♟ 支配', leftLabel: '排除', rightLabel: '征服', initialValue: 0 }),
  Object.freeze({ key: 'egoism', name: '我欲', englishName: 'Egoism', label: '♛ 我欲', leftLabel: '享楽', rightLabel: '独占', initialValue: 0 }),
  Object.freeze({ key: 'innovation', name: '変革', englishName: 'Innovation', label: '⚙ 変革', leftLabel: '破壊', rightLabel: '改造', initialValue: 0 }),
  Object.freeze({ key: 'prestige', name: '威信', englishName: 'Prestige', label: '♜ 威信', leftLabel: '畏怖', rightLabel: '崇拝', initialValue: 0 }),
  Object.freeze({ key: 'madness', name: '狂気', englishName: 'Madness', label: '☯ 狂気', leftLabel: '狂信', rightLabel: '混沌', initialValue: 0 }),
]);

export function createInitialMeter() {
  return Object.fromEntries(AXES.map((axis) => [axis.key, axis.initialValue]));
}

export default AXES;
