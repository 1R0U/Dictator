const test = require('node:test');
const assert = require('node:assert/strict');
const {
  COLLAPSE_ROUTES,
  advanceCollapseRisk,
  advanceCollapseState,
  determineCollapseRoute,
  shouldTriggerNationCollapse,
} = require('../game/milestoneEnding');
const { ENDING_CATALOG } = require('../data/endingCatalog');

// 専用滅亡軸の導入まではpreviousRiskも引き継がず、常に0へリセットする。
test('専用滅亡軸の導入まで欲望5軸はリスクへ影響せずリスクは0のままとなる', () => {
  const extremeDesires = {
    domination: -100,
    egoism: 100,
    innovation: -100,
    prestige: 100,
    madness: -100,
  };
  assert.equal(advanceCollapseRisk({ previousRisk: 99, axes: extremeDesires }), 0);
  assert.deepEqual(advanceCollapseState({ previousRisk: 99, axes: extremeDesires }), {
    pressure: {},
    risk: 0,
  });
});

test('専用滅亡軸の導入まではルート確定と滅亡発火を行わない', () => {
  assert.equal(determineCollapseRoute({ domination: 100 }), null);
  assert.equal(shouldTriggerNationCollapse(100), false);
});

test('既存の10滅亡コンテンツは将来の専用判定用に保持する', () => {
  const routes = Object.values(COLLAPSE_ROUTES);
  assert.equal(routes.length, 10);
  assert.equal(new Set(routes).size, 10);
  routes.forEach((route) => assert.ok(ENDING_CATALOG[route]));
});
