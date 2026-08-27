const test = require('node:test');
const assert = require('node:assert/strict');

const { createFallbackMapping } = require('../game/desireFallback');

test('API失敗時も宣言内容を5軸へ独立して配点する', () => {
  const mapping = createFallbackMapping('国民の財産を所有し、軍と警察への服従を命令する');

  assert.equal(mapping.wealth, 80);
  assert.equal(mapping.power, 100);
  assert.equal(mapping.fame, 50);
  assert.equal(mapping.love, 50);
  assert.equal(mapping.pleasure, 50);
  assert.ok(new Set(Object.values(mapping)).size > 1);
});

test('軸ごとの増加要因と減少要因を別々に反映する', () => {
  const mapping = createFallbackMapping('命令で男女差別を進め、娯楽を禁止して禁欲を強いる');

  assert.equal(mapping.wealth, 50);
  assert.equal(mapping.power, 80);
  assert.equal(mapping.fame, 50);
  assert.equal(mapping.love, 20);
  assert.equal(mapping.pleasure, 35);
});

test('根拠のない軸は中立値を保つ', () => {
  assert.deepEqual(createFallbackMapping(''), {
    wealth: 50,
    power: 50,
    fame: 50,
    love: 50,
    pleasure: 50,
  });
});
