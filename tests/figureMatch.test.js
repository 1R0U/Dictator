const test = require('node:test');
const assert = require('node:assert/strict');

const { computeDesireDistance, matchFigure } = require('../game/figureMatch');
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

test('データセット内の全人物に重複しないkeyと、名前・エピセット・パターンがある', () => {
  const keys = FIGURES.map((figure) => figure.key);
  assert.equal(new Set(keys).size, FIGURES.length);
  assert.ok(FIGURES.length >= 30);

  for (const figure of FIGURES) {
    assert.ok(figure.name);
    assert.ok(figure.epithet);
    assert.ok(figure.pattern);
  }
});

test('AI応答が得られない場合のフォールバック一言紹介に人物名を含む', () => {
  const target = FIGURES[0];
  assert.match(buildFallbackBlurb(target), new RegExp(target.name));
});
