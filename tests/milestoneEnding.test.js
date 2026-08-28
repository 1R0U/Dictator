const test = require('node:test');
const assert = require('node:assert/strict');

const {
  COLLAPSE_RISK_THRESHOLD,
  COLLAPSE_ROUTES,
  advanceCollapseState,
  advanceCollapseRisk,
  determineCollapseRoute,
  shouldTriggerNationCollapse,
} = require('../game/milestoneEnding');
const { ENDING_CATALOG } = require('../data/endingCatalog');

function simulateAllMilestones(axes) {
  let risk = 0;
  for (let milestoneIndex = 0; milestoneIndex < 10; milestoneIndex += 1) {
    risk = advanceCollapseRisk({ previousRisk: risk, axes, milestoneIndex });
  }
  return risk;
}

test('危険な欲望と時間経過によって滅亡リスクが累積する', () => {
  const axes = { domination: 90, egoism: 80, innovation: 70, prestige: 60, madness: 90 };
  const early = advanceCollapseRisk({ previousRisk: 10, axes, milestoneIndex: 0 });
  const late = advanceCollapseRisk({ previousRisk: 10, axes, milestoneIndex: 8 });
  assert.ok(early > 10);
  assert.ok(late > early);
  assert.ok(late <= COLLAPSE_RISK_THRESHOLD);
});

test('追加宣言による欲望値の急変もリスクへ加算する', () => {
  const previousAxes = { domination: 50, egoism: 50, innovation: 50, prestige: 50, madness: 50 };
  const axes = { domination: 80, egoism: 50, innovation: 50, prestige: 50, madness: 80 };
  assert.ok(
    advanceCollapseRisk({ previousRisk: 0, axes, previousAxes, milestoneIndex: 3 })
      > advanceCollapseRisk({ previousRisk: 0, axes, milestoneIndex: 3 }),
  );
});

test('過去に蓄積した軸別圧力を最後の欲望値だけで上書きしない', () => {
  const state = advanceCollapseState({
    previousRisk: 80,
    previousPressure: { domination: 70 },
    previousAxes: { domination: 95, egoism: 50, innovation: 50, prestige: 50, madness: 50 },
    axes: { domination: 10, egoism: 10, innovation: 10, prestige: 10, madness: 10 },
    milestoneIndex: 8,
  });

  assert.equal(state.risk, COLLAPSE_RISK_THRESHOLD);
  assert.equal(
    determineCollapseRoute(
      { domination: 10, egoism: 10, innovation: 10, prestige: 10, madness: 10 },
      state.pressure,
    ),
    COLLAPSE_ROUTES.oppression,
  );
});

test('共通の制度疲労は単一軸や低欲望の滅亡原因を上書きしない', () => {
  let dominationState = { risk: 0, pressure: {} };
  let lowState = { risk: 0, pressure: {} };
  const dominationAxes = { domination: 95, egoism: 50, innovation: 50, prestige: 50, madness: 50 };
  const lowAxes = { domination: 15, egoism: 15, innovation: 15, prestige: 15, madness: 15 };

  for (let milestoneIndex = 0; milestoneIndex < 10; milestoneIndex += 1) {
    dominationState = advanceCollapseState({
      previousRisk: dominationState.risk,
      previousPressure: dominationState.pressure,
      axes: dominationAxes,
      previousAxes: dominationAxes,
      milestoneIndex,
    });
    lowState = advanceCollapseState({
      previousRisk: lowState.risk,
      previousPressure: lowState.pressure,
      axes: lowAxes,
      previousAxes: lowAxes,
      milestoneIndex,
    });
  }

  assert.equal(determineCollapseRoute(dominationAxes, dominationState.pressure), COLLAPSE_ROUTES.oppression);
  assert.equal(determineCollapseRoute(lowAxes, lowState.pressure), COLLAPSE_ROUTES.void);
});

test('複合ルートは対象の2軸が同時に危険域へ入った場合だけ蓄積する', () => {
  const balancedAxes = { domination: 72, egoism: 72, innovation: 72, prestige: 72, madness: 72 };
  const dangerousAxes = { domination: 90, egoism: 50, innovation: 50, prestige: 50, madness: 90 };
  let balancedState = { risk: 0, pressure: {} };
  let dangerousState = { risk: 0, pressure: {} };

  for (let milestoneIndex = 0; milestoneIndex < 10; milestoneIndex += 1) {
    balancedState = advanceCollapseState({
      previousRisk: balancedState.risk,
      previousPressure: balancedState.pressure,
      axes: balancedAxes,
      previousAxes: balancedAxes,
      milestoneIndex,
    });
    dangerousState = advanceCollapseState({
      previousRisk: dangerousState.risk,
      previousPressure: dangerousState.pressure,
      axes: dangerousAxes,
      previousAxes: dangerousAxes,
      milestoneIndex,
    });
  }

  assert.equal(determineCollapseRoute(balancedAxes, balancedState.pressure), COLLAPSE_ROUTES.quiet);
  assert.equal(
    determineCollapseRoute(dangerousAxes, dangerousState.pressure),
    COLLAPSE_ROUTES.bloodyRevolution,
  );
});

test('リスク100到達時だけ国家滅亡へ分岐する', () => {
  assert.equal(shouldTriggerNationCollapse(COLLAPSE_RISK_THRESHOLD), true);
  assert.equal(shouldTriggerNationCollapse(COLLAPSE_RISK_THRESHOLD - 1), false);
});

test('危険な複合軸を単一軸より優先して判定する', () => {
  assert.equal(determineCollapseRoute({ domination: 90, madness: 90 }), COLLAPSE_ROUTES.bloodyRevolution);
  assert.equal(determineCollapseRoute({ egoism: 90, prestige: 90 }), COLLAPSE_ROUTES.goldenPalace);
  assert.equal(determineCollapseRoute({ innovation: 90, madness: 90 }), COLLAPSE_ROUTES.forbiddenCreation);
});

test('低欲望と中程度の長期蓄積には特殊ルートを選ぶ', () => {
  assert.equal(
    determineCollapseRoute({ domination: 20, egoism: 20, innovation: 20, prestige: 20, madness: 20 }),
    COLLAPSE_ROUTES.void,
  );
  assert.equal(
    determineCollapseRoute({ domination: 65, egoism: 60, innovation: 70, prestige: 55, madness: 68 }),
    COLLAPSE_ROUTES.quiet,
  );
});

test('突出した単一軸から5種類の基本ルートを選ぶ', () => {
  const base = { domination: 50, egoism: 50, innovation: 50, prestige: 50, madness: 50 };
  const cases = [
    ['domination', COLLAPSE_ROUTES.oppression],
    ['egoism', COLLAPSE_ROUTES.privatization],
    ['innovation', COLLAPSE_ROUTES.runawayReform],
    ['prestige', COLLAPSE_ROUTES.prestigeWar],
    ['madness', COLLAPSE_ROUTES.fanaticism],
  ];
  cases.forEach(([key, route]) => {
    assert.equal(determineCollapseRoute({ ...base, [key]: 90 }), route);
  });
});

test('10種類の滅亡ルートすべてにエンディング定義がある', () => {
  const routes = Object.values(COLLAPSE_ROUTES);
  assert.equal(routes.length, 10);
  assert.equal(new Set(routes).size, 10);
  routes.forEach((route) => assert.ok(ENDING_CATALOG[route]));
});

test('特殊ルートは到達可能で、中立的な国家は自動滅亡しない', () => {
  const moderate = { domination: 65, egoism: 60, innovation: 70, prestige: 55, madness: 68 };
  const low = { domination: 20, egoism: 20, innovation: 20, prestige: 20, madness: 20 };
  const neutral = { domination: 50, egoism: 50, innovation: 50, prestige: 50, madness: 50 };

  assert.equal(simulateAllMilestones(moderate), COLLAPSE_RISK_THRESHOLD);
  assert.equal(determineCollapseRoute(moderate), COLLAPSE_ROUTES.quiet);
  assert.equal(simulateAllMilestones(low), COLLAPSE_RISK_THRESHOLD);
  assert.equal(determineCollapseRoute(low), COLLAPSE_ROUTES.void);
  assert.ok(simulateAllMilestones(neutral) < COLLAPSE_RISK_THRESHOLD);
});

test('全軸が高いだけでは6番の血の革命へ固定されない', () => {
  const axes = {
    domination: 90,
    egoism: 88,
    innovation: 86,
    prestige: 87,
    madness: 91,
  };
  let state = { risk: 0, pressure: {} };

  for (let milestoneIndex = 0; milestoneIndex < 10; milestoneIndex += 1) {
    state = advanceCollapseState({
      previousRisk: state.risk,
      previousPressure: state.pressure,
      axes,
      previousAxes: axes,
      milestoneIndex,
    });
  }

  assert.equal(determineCollapseRoute(axes, state.pressure), COLLAPSE_ROUTES.fanaticism);
  assert.equal(determineCollapseRoute(axes), COLLAPSE_ROUTES.fanaticism);
  assert.equal(determineCollapseRoute(axes, {}), COLLAPSE_ROUTES.fanaticism);
});

test('支配と狂気が他軸より突出した場合は6番の血の革命を維持する', () => {
  const axes = {
    domination: 92,
    egoism: 50,
    innovation: 48,
    prestige: 52,
    madness: 94,
  };
  let state = { risk: 0, pressure: {} };

  for (let milestoneIndex = 0; milestoneIndex < 10; milestoneIndex += 1) {
    state = advanceCollapseState({
      previousRisk: state.risk,
      previousPressure: state.pressure,
      axes,
      previousAxes: axes,
      milestoneIndex,
    });
  }

  assert.equal(
    determineCollapseRoute(axes, state.pressure),
    COLLAPSE_ROUTES.bloodyRevolution,
  );
});

test('複合ルート6・7・8は同じ突出度で基本ルートから切り替わる', () => {
  const cases = [
    {
      keys: ['domination', 'madness'],
      basicRoute: COLLAPSE_ROUTES.fanaticism,
      compoundRoute: COLLAPSE_ROUTES.bloodyRevolution,
    },
    {
      keys: ['egoism', 'prestige'],
      basicRoute: COLLAPSE_ROUTES.privatization,
      compoundRoute: COLLAPSE_ROUTES.goldenPalace,
    },
    {
      keys: ['innovation', 'madness'],
      basicRoute: COLLAPSE_ROUTES.fanaticism,
      compoundRoute: COLLAPSE_ROUTES.forbiddenCreation,
    },
  ];

  cases.forEach(({ keys, basicRoute, compoundRoute }) => {
    const base = { domination: 70, egoism: 70, innovation: 70, prestige: 70, madness: 70 };
    const belowBoundary = { ...base, [keys[0]]: 84, [keys[1]]: 84 };
    const atBoundary = { ...base, [keys[0]]: 86, [keys[1]]: 86 };

    assert.equal(determineCollapseRoute(belowBoundary), basicRoute);
    assert.equal(determineCollapseRoute(atBoundary), compoundRoute);
  });
});

test('一定の欲望値では累積判定と直接判定が一致する', () => {
  const profiles = [
    { domination: 82, egoism: 70, innovation: 70, prestige: 70, madness: 82 },
    { domination: 70, egoism: 88, innovation: 70, prestige: 88, madness: 70 },
    { domination: 70, egoism: 70, innovation: 90, prestige: 70, madness: 90 },
  ];

  profiles.forEach((axes) => {
    let state = { risk: 0, pressure: {} };
    for (let milestoneIndex = 0; milestoneIndex < 10; milestoneIndex += 1) {
      state = advanceCollapseState({
        previousRisk: state.risk,
        previousPressure: state.pressure,
        axes,
        previousAxes: axes,
        milestoneIndex,
      });
    }
    assert.equal(
      determineCollapseRoute(axes, state.pressure),
      determineCollapseRoute(axes),
    );
  });
});
