const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DESIRE_MAX,
  DESIRE_MIN,
  DESIRE_NEUTRAL,
  applyDesireScore,
  clampDesireValue,
  normalizeDesireAxes,
} = require('../game/desireScale');

test('欲望値を0〜100の整数へ補正する', () => {
  assert.equal(clampDesireValue(-5), DESIRE_MIN);
  assert.equal(clampDesireValue(42.6), 43);
  assert.equal(clampDesireValue(105), DESIRE_MAX);
  assert.equal(clampDesireValue(undefined), DESIRE_NEUTRAL);
});

test('追加宣言は50を中立として現在値へ反映する', () => {
  assert.equal(applyDesireScore(40, 50), 40);
  assert.equal(applyDesireScore(40, 70), 60);
  assert.equal(applyDesireScore(40, 20), 10);
  assert.equal(applyDesireScore(90, 80), 100);
});

test('5軸すべてを0〜100へ正規化する', () => {
  assert.deepEqual(normalizeDesireAxes({ wealth: 120, power: 25 }), {
    wealth: 100,
    power: 25,
    fame: 50,
    love: 50,
    pleasure: 50,
  });
});
