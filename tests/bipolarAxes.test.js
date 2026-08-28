const test = require('node:test');
const assert = require('node:assert/strict');

const { AXES, createInitialMeter } = require('../data/axes');
const { redactDesireDisclosure } = require('../game/desireDisclosure');

test('5軸が指定された左右の極と中央0を持つ', () => {
  assert.deepEqual(AXES.map(({ name, leftLabel, rightLabel }) => (
    [name, leftLabel, rightLabel]
  )), [
    ['支配', '排除', '征服'],
    ['我欲', '享楽', '独占'],
    ['変革', '破壊', '改造'],
    ['威信', '畏怖', '崇拝'],
    ['狂気', '狂信', '混沌'],
  ]);
  assert.deepEqual(createInitialMeter(), {
    domination: 0, egoism: 0, innovation: 0, prestige: 0, madness: 0,
  });
});

test('双極方向や符号付き内部値を生成文から除去する', () => {
  const result = redactDesireDisclosure('改革が進んだ。domination:征服-extreme、madness:-80。工場が12棟できた。');
  assert.doesNotMatch(result, /domination|madness|征服-extreme|-80/i);
  assert.match(result, /工場が12棟/);
});
