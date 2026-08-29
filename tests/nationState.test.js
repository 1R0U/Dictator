const test = require('node:test');
const assert = require('node:assert/strict');
const { INITIAL_NATION_STATE, applyNationStateDelta, normalizeNationStateDelta } = require('../game/nationState');

test('国家6指標は改善と悪化の余地を持つ70%から始まる', () => {
  assert.deepEqual(INITIAL_NATION_STATE, { population: 70, treasury: 70, infrastructure: 70, publicOrder: 70, governance: 70, approval: 70 });
});

test('AIの変化量は上下限を設けず整数へ丸める', () => {
  assert.deepEqual(normalizeNationStateDelta({ population: -180, treasury: 250, infrastructure: -4.6 }), { population: -180, treasury: 250, infrastructure: -5, publicOrder: 0, governance: 0, approval: 0 });
});

test('制限のない変化量でも適用後の国家状態は0〜100%に収まる', () => {
  const result = applyNationStateDelta(INITIAL_NATION_STATE, { population: -500, treasury: 500 });
  assert.equal(result.population, 0);
  assert.equal(result.treasury, 100);
});

test('変化後の国家状態を0〜100%へ収める', () => {
  assert.deepEqual(applyNationStateDelta({ ...INITIAL_NATION_STATE, population: 10, treasury: 95 }, { population: -20, treasury: 15 }), { population: 0, treasury: 100, infrastructure: 70, publicOrder: 70, governance: 70, approval: 70 });
});
