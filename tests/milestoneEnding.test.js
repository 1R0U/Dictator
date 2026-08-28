const test = require('node:test');
const assert = require('node:assert/strict');
const { COLLAPSE_ROUTES, advanceCollapseState, determineCollapseRoute, shouldTriggerNationCollapse } = require('../game/milestoneEnding');
const { ENDING_CATALOG } = require('../data/endingCatalog');

const healthy = Object.freeze({ population: 100, treasury: 100, infrastructure: 100, publicOrder: 100, governance: 100, approval: 100 });

test('ニュース由来の変化量を前時点の国家状態へ加算する', () => {
  const result = advanceCollapseState({ previousPressure: healthy, stateDelta: { population: -12, treasury: -20, approval: 5 } });
  assert.deepEqual(result.pressure, { population: 88, treasury: 80, infrastructure: 100, publicOrder: 100, governance: 100, approval: 100 });
  assert.equal(result.risk, 20);
});

test('国家総崩壊と具体的な複合条件を単独0%条件より優先する', () => {
  assert.equal(determineCollapseRoute({ ...healthy, population: 20, treasury: 20, infrastructure: 20, publicOrder: 20 }), COLLAPSE_ROUTES.totalNationalCollapse);
  assert.equal(determineCollapseRoute({ ...healthy, publicOrder: 20, governance: 25 }), COLLAPSE_ROUTES.civilWarPartition);
  assert.equal(determineCollapseRoute({ ...healthy, approval: 25, governance: 30 }), COLLAPSE_ROUTES.revolutionCoup);
  assert.equal(determineCollapseRoute({ ...healthy, population: 35, infrastructure: 20 }), COLLAPSE_ROUTES.famine);
  assert.equal(determineCollapseRoute({ ...healthy, treasury: 20, governance: 25 }), COLLAPSE_ROUTES.economicAdministrativeCollapse);
  assert.equal(determineCollapseRoute({ ...healthy, infrastructure: 20, publicOrder: 25 }), COLLAPSE_ROUTES.riotsLooting);
});

test('特殊滅亡信号は数値条件より優先する', () => {
  assert.equal(determineCollapseRoute({ ...healthy, treasury: 0 }, { nuclearWar: true }), COLLAPSE_ROUTES.nuclearWar);
  assert.equal(shouldTriggerNationCollapse(healthy, { aiTakeover: true }), true);
});

test('安全な国家状態では滅亡しない', () => {
  assert.equal(determineCollapseRoute(healthy), null);
  assert.equal(shouldTriggerNationCollapse(healthy), false);
});

test('新しい19滅亡コンテンツを専用判定用に保持する', () => {
  const routes = Object.values(COLLAPSE_ROUTES);
  assert.equal(routes.length, 19);
  assert.equal(new Set(routes).size, 19);
  routes.forEach((route) => assert.ok(ENDING_CATALOG[route]));
});
