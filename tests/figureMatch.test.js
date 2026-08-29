const test = require('node:test');
const assert = require('node:assert/strict');

const {
  computeDesireDistance,
  isCurrentFigureSnapshot,
  matchFigure,
  resolveCurrentFigure,
} = require('../game/figureMatch');
const { FIGURES, buildFallbackBlurb } = require('../data/figures');

test('候補人物のパターンと完全一致する欲望軸は距離0でその人物を選出する', () => {
  const target = FIGURES[0];
  const result = matchFigure(target.pattern);

  assert.equal(result.figure.key, target.key);
  assert.equal(result.distance, 0);
});

test('全軸が近い候補人物を最短距離で選出する', () => {
  const target = FIGURES[3];
  const nearby = Object.fromEntries(
    Object.entries(target.pattern).map(([key, value]) => [key, value + 2]),
  );
  const result = matchFigure(nearby);

  assert.equal(result.figure.key, target.key);
});

test('候補人物リストが空なら null を返す', () => {
  assert.equal(matchFigure({ domination: 50, egoism: 50, innovation: 50, prestige: 50, madness: 50 }, []), null);
});

test('ユークリッド距離を軸ごとの差から算出する', () => {
  const distance = computeDesireDistance(
    { domination: 0, egoism: 0, innovation: 0, prestige: 0, madness: 0 },
    { domination: 3, egoism: 4, innovation: 0, prestige: 0, madness: 0 },
  );

  assert.equal(distance, 5);
});

test('データセット内の26人に重複しないkeyと、名前・タイプ・双極パターンがある', () => {
  const keys = FIGURES.map((figure) => figure.key);
  assert.equal(new Set(keys).size, FIGURES.length);
  assert.equal(FIGURES.length, 26);

  for (const figure of FIGURES) {
    assert.ok(figure.name);
    assert.ok(figure.type);
    assert.ok(figure.pattern);
    assert.ok(Object.values(figure.pattern).every((value) => value >= -100 && value <= 100));
  }
});

test('AI応答が得られない場合のフォールバック一言紹介に人物名を含む', () => {
  const target = FIGURES[0];
  assert.match(buildFallbackBlurb(target), new RegExp(target.name));
});

test('現行人物の保存スナップショットは紹介文を再利用できる', () => {
  const target = FIGURES[0];
  assert.equal(isCurrentFigureSnapshot(target), true);
  assert.deepEqual(resolveCurrentFigure(target.pattern, target), {
    figure: target,
    canReuseCopy: true,
  });
});

test('旧人物の保存スナップショットは最終5軸から現行26人へ再診断する', () => {
  const oldFigure = {
    key: 'caesar',
    name: '旧候補',
    epithet: '旧紹介',
    pattern: { domination: 0, egoism: 0, innovation: 0, prestige: 0, madness: 0 },
  };
  const result = resolveCurrentFigure(FIGURES[5].pattern, oldFigure);

  assert.equal(isCurrentFigureSnapshot(oldFigure), false);
  assert.equal(result.figure.key, FIGURES[5].key);
  assert.equal(result.canReuseCopy, false);
});

test('同じkeyでも旧形式または値が異なる人物データは再利用しない', () => {
  const current = FIGURES[6];
  const stale = {
    ...current,
    type: undefined,
    pattern: { ...current.pattern, domination: current.pattern.domination + 1 },
  };

  assert.equal(isCurrentFigureSnapshot(stale), false);
});
