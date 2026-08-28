const test = require('node:test');
const assert = require('node:assert/strict');
const { BIAS_BALANCED_COMMENT, getDesireBiasComment } = require('../game/desireBias');

test('絶対値が最も大きい軸と符号に応じたコメントを返す', () => {
  assert.match(getDesireBiasComment({ domination: -90, madness: 70 }), /排除/);
  assert.match(getDesireBiasComment({ domination: 40, madness: 90 }), /混沌/);
});

test('全軸が中央付近なら均衡コメントを返す', () => {
  assert.equal(getDesireBiasComment({ domination: 10 }), BIAS_BALANCED_COMMENT);
  assert.equal(getDesireBiasComment({}), BIAS_BALANCED_COMMENT);
});
