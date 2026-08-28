const test = require('node:test');
const assert = require('node:assert/strict');
const { createFallbackMapping } = require('../game/desireFallback');

test('左右の極を示す語を符号付きで評価する', () => {
  const mapping = createFallbackMapping('反対者を排除し、国民から崇拝されたい');
  assert.equal(mapping.domination, -70);
  assert.equal(mapping.prestige, 70);
  assert.equal(mapping.egoism, 0);
});

test('同じ軸の左右が同数なら中立になる', () => {
  assert.equal(createFallbackMapping('制度を破壊してから改造する').innovation, 0);
});

test('根拠のない軸はすべて0を保つ', () => {
  assert.deepEqual(createFallbackMapping(''), {
    domination: 0, egoism: 0, innovation: 0, prestige: 0, madness: 0,
  });
});
