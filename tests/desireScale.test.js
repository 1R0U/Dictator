const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyDesireScore,
  calculateBaseDeclarationDelta,
  clampDesireValue,
  convertLegacyDesireAxes,
  extrapolateMissedDeclarations,
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

test('滅亡時、未消化の追加宣言分をそれまでの傾向から自動で加算する', () => {
  const axes = {
    domination: 40, egoism: -20, innovation: 0, prestige: 10, madness: -5,
  };

  // 追加宣言0回で滅亡：残り3回分（倍率1.2/1.4/1.6）を自動加算する。
  const zeroCompleted = extrapolateMissedDeclarations(axes, 0);
  const expected = [1, 2, 3].reduce((current, progressionIndex) => (
    Object.fromEntries(Object.keys(current).map((key) => [
      key, applyDesireScore(current[key], current[key], progressionIndex),
    ]))
  ), normalizeDesireAxes(axes));
  assert.deepEqual(zeroCompleted, expected);

  // 追加宣言を3回すべて消化済みなら何も加算しない。
  assert.deepEqual(extrapolateMissedDeclarations(axes, 3), normalizeDesireAxes(axes));

  // 中立(0)の軸は傾向がないため加算されない。
  assert.equal(extrapolateMissedDeclarations({ ...axes, innovation: 0 }, 2).innovation, 0);
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
