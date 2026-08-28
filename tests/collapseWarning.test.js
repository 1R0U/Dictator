const test = require('node:test');
const assert = require('node:assert/strict');
const { WARNING_LEVELS, getCollapseWarning } = require('../game/collapseWarning');

test('全指標が安全圏なら側近は警告しない', () => {
  assert.equal(getCollapseWarning({ population: 80, treasury: 70, infrastructure: 60, publicOrder: 90, governance: 75, approval: 50 }), null);
});

test('40以下の最も危険な指標だけを数値なしで警告する', () => {
  const warning = getCollapseWarning({ population: 35, treasury: 22, infrastructure: 30, publicOrder: 70, governance: 80, approval: 50 });
  assert.equal(warning.axis, 'treasury');
  assert.equal(warning.level, WARNING_LEVELS.DANGER);
  assert.match(warning.message, /国庫/);
  assert.doesNotMatch(warning.message, /22|%/);
});

test('危険度に応じて注意・危機・滅亡寸前の三段階になる', () => {
  assert.equal(getCollapseWarning({ approval: 40 }).level, WARNING_LEVELS.CAUTION);
  assert.equal(getCollapseWarning({ approval: 25 }).level, WARNING_LEVELS.DANGER);
  assert.equal(getCollapseWarning({ approval: 10 }).level, WARNING_LEVELS.IMMINENT);
});

test('欠損値や不正値は無視して安全に処理する', () => {
  assert.equal(getCollapseWarning(), null);
  assert.equal(getCollapseWarning([]), null);
  assert.equal(getCollapseWarning({ population: '不明', treasury: null }), null);
});
