const test = require('node:test');
const assert = require('node:assert/strict');

const { createFallbackMapping } = require('../game/desireFallback');

test('API失敗時も宣言内容を5軸へ独立して配点する', () => {
  const mapping = createFallbackMapping('軍と警察による圧政で国民を服従させ、私利のために貪欲な独占を進める');

  assert.equal(mapping.domination, 85);
  assert.equal(mapping.egoism, 85);
  assert.equal(mapping.innovation, 50);
  assert.equal(mapping.prestige, 50);
  assert.equal(mapping.madness, 50);
  assert.ok(new Set(Object.values(mapping)).size > 1);
});

test('軸ごとの増加要因と減少要因を別々に反映する', () => {
  const mapping = createFallbackMapping('独裁を命令し、献身と犠牲を強いる。創世の改革を恐怖で進める狂信国家だ');

  assert.equal(mapping.domination, 85);
  assert.equal(mapping.egoism, 15);
  assert.equal(mapping.innovation, 85);
  assert.equal(mapping.prestige, 85);
  assert.equal(mapping.madness, 85);
});

test('中段階の指標が複数あっても高評価へ変化しない', () => {
  const mapping = createFallbackMapping('偏執と妄信に満ちた国家だが、威厳と尊敬は保たれている');

  assert.equal(mapping.madness, 50);
  assert.equal(mapping.prestige, 50);
});

test('根拠のない軸は中立値を保つ', () => {
  assert.deepEqual(createFallbackMapping(''), {
    domination: 50,
    egoism: 50,
    innovation: 50,
    prestige: 50,
    madness: 50,
  });
});
