const test = require('node:test');
const assert = require('node:assert/strict');
const { INITIAL_NATION_STATE, applyNationStateDelta, normalizeNationStateDelta } = require('../game/nationState');

test('国家6指標は改善と悪化の余地を持つ70%から始まる', () => {
  assert.deepEqual(INITIAL_NATION_STATE, { population: 70, treasury: 70, infrastructure: 70, publicOrder: 70, governance: 70, approval: 70 });
});

test('AIの変化量を-35〜20の整数へ補正する', () => {
  assert.deepEqual(normalizeNationStateDelta({ population: -80, treasury: 50, infrastructure: -4.6 }), { population: -35, treasury: 20, infrastructure: -5, publicOrder: 0, governance: 0, approval: 0 });
});

test('変化後の国家状態を0〜100%へ収める', () => {
  assert.deepEqual(applyNationStateDelta({ ...INITIAL_NATION_STATE, population: 10, treasury: 95 }, { population: -20, treasury: 15 }), { population: 0, treasury: 100, infrastructure: 70, publicOrder: 70, governance: 70, approval: 70 });
});
