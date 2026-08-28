const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyDesireScore,
  calculateBaseDeclarationDelta,
  clampDesireValue,
  convertLegacyDesireAxes,
  moveDesireAxesTowardNeutral,
  normalizeDesireAxes,
} = require('../game/desireScale');

test('欲望値を-100〜100へ補正し、0を中立にする', () => {
  assert.equal(clampDesireValue(-120), -100);
  assert.equal(clampDesireValue(42.6), 43);
  assert.equal(clampDesireValue(120), 100);
  assert.equal(clampDesireValue(undefined), 0);
});

test('追加宣言は符号の方向へ現在値を動かす', () => {
  assert.equal(applyDesireScore(40, 0), 40);
  assert.ok(applyDesireScore(40, 80) > 40);
  assert.ok(applyDesireScore(40, -80) < 40);
  assert.ok(applyDesireScore(95, 100) <= 100);
});

test('欠損軸は0として5軸を正規化する', () => {
  assert.deepEqual(normalizeDesireAxes({ domination: -120, egoism: 25 }), {
    domination: -100, egoism: 25, innovation: 0, prestige: 0, madness: 0,
  });
});

test('旧0〜100尺度を新しい双極尺度へ変換する', () => {
  assert.deepEqual(convertLegacyDesireAxes({ domination: 0, egoism: 50, innovation: 100 }), {
    domination: -100, egoism: 0, innovation: 100, prestige: 0, madness: 0,
  });
});

test('同じ評価なら後半の宣言ほど加算量の絶対値が大きい', () => {
  const positiveDeltas = [0, 1, 2, 3].map(
    (index) => applyDesireScore(0, 100, index),
  );
  const negativeDeltas = [0, 1, 2, 3].map(
    (index) => applyDesireScore(0, -100, index),
  );

  assert.deepEqual(positiveDeltas, [25, 30, 35, 40]);
  assert.deepEqual(negativeDeltas, [-25, -30, -35, -40]);
});

test('追加宣言は①として確定した値へ回数別倍率をかけて加算する', () => {
  assert.equal(calculateBaseDeclarationDelta(53), 13);
  assert.equal(calculateBaseDeclarationDelta(-53), -13);

  assert.deepEqual(
    [0, 1, 2, 3].map((index) => applyDesireScore(10, 53, index) - 10),
    [13, 16, 18, 21],
  );
  assert.deepEqual(
    [0, 1, 2, 3].map((index) => applyDesireScore(-10, -53, index) + 10),
    [-13, -16, -18, -21],
  );
});

test('強い宣言を重ねると欲望値が上限と下限へ到達できる', () => {
  const positive = [0, 1, 2, 3].reduce(
    (current, index) => applyDesireScore(current, 100, index),
    0,
  );
  const negative = [0, 1, 2, 3].reduce(
    (current, index) => applyDesireScore(current, -100, index),
    0,
  );

  assert.equal(positive, 100);
  assert.equal(negative, -100);
});

test('スキップ時はすべての軸を5ずつ中央へ近づける', () => {
  assert.deepEqual(moveDesireAxesTowardNeutral({
    domination: -80,
    egoism: -3,
    innovation: 0,
    prestige: 4,
    madness: 100,
  }), {
    domination: -75,
    egoism: 0,
    innovation: 0,
    prestige: 0,
    madness: 95,
  });
});
