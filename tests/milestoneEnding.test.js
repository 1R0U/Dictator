const test = require('node:test');
const assert = require('node:assert/strict');

const { NATION_COLLAPSE_THRESHOLD, shouldTriggerNationCollapse } = require('../game/milestoneEnding');

test('支配または狂気が閾値以上なら国の滅亡エンドへ分岐する', () => {
  assert.equal(
    shouldTriggerNationCollapse({
      domination: NATION_COLLAPSE_THRESHOLD,
      egoism: 50,
      innovation: 50,
      prestige: 50,
      madness: 50,
    }),
    true,
  );
  assert.equal(
    shouldTriggerNationCollapse({
      domination: 50,
      egoism: 50,
      innovation: 50,
      prestige: 50,
      madness: NATION_COLLAPSE_THRESHOLD,
    }),
    true,
  );
});

test('閾値未満なら国は存続する', () => {
  assert.equal(
    shouldTriggerNationCollapse({
      domination: NATION_COLLAPSE_THRESHOLD - 1,
      egoism: 50,
      innovation: 50,
      prestige: 50,
      madness: NATION_COLLAPSE_THRESHOLD - 1,
    }),
    false,
  );
});

test('欠損値は中立値として扱われる', () => {
  assert.equal(shouldTriggerNationCollapse({}), false);
});
