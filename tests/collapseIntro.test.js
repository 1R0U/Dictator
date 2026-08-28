const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldStartCollapseIntro } = require('../game/collapseIntro');

test('ライブの国家滅亡で未再生の場合だけ演出を開始する', () => {
  assert.equal(shouldStartCollapseIntro({
    enabled: true,
    endingType: 'collapse_anarchy',
    hasCollapseVisual: true,
    playedEndingType: null,
  }), true);
});

test('同じ国家滅亡では演出を二度開始しない', () => {
  assert.equal(shouldStartCollapseIntro({
    enabled: true,
    endingType: 'collapse_anarchy',
    hasCollapseVisual: true,
    playedEndingType: 'collapse_anarchy',
  }), false);
});

test('履歴表示と通常エンドでは演出を開始しない', () => {
  assert.equal(shouldStartCollapseIntro({
    enabled: false,
    endingType: 'collapse_anarchy',
    hasCollapseVisual: true,
    playedEndingType: null,
  }), false);
  assert.equal(shouldStartCollapseIntro({
    enabled: true,
    endingType: 'ironic_peace',
    hasCollapseVisual: false,
    playedEndingType: null,
  }), false);
});
