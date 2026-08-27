const test = require('node:test');
const assert = require('node:assert/strict');

const {
  BIAS_BALANCED_COMMENT,
  getDesireBiasComment,
} = require('../game/desireBias');

test('最も高い軸と最も低い軸の一言を組み合わせて返す', () => {
  const comment = getDesireBiasComment({
    domination: 95,
    egoism: 50,
    innovation: 50,
    prestige: 50,
    madness: 5,
  });

  assert.match(comment, /支配欲が振り切れている/);
  assert.match(comment, /狂気は最下位/);
});

test('全軸が同値なら均衡コメントを返す', () => {
  const comment = getDesireBiasComment({
    domination: 50,
    egoism: 50,
    innovation: 50,
    prestige: 50,
    madness: 50,
  });

  assert.equal(comment, BIAS_BALANCED_COMMENT);
});

test('欠損値は中立値として扱われる', () => {
  const comment = getDesireBiasComment({ domination: 90 });
  assert.match(comment, /支配欲が振り切れている/);
});
