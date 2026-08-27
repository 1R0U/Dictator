const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

require.extensions['.png'] = (module, filename) => {
  module.exports = filename;
};
require.extensions['.jpg'] = (module, filename) => {
  module.exports = filename;
};

const { COLLAPSE_ROUTES } = require('../game/milestoneEnding');
const { COLLAPSE_VISUALS, getCollapseVisual } = require('../data/collapseVisuals');
const { ENDING_CATALOG } = require('../data/endingCatalog');

const EXPECTED_LABELS = Object.freeze([
  '圧政崩壊',
  '私物化破綻',
  '改革暴走',
  '威信戦争',
  '狂信的破滅',
  '血塗られた革命',
  '黄金宮殿の終焉',
  '禁断の創世',
  '静かな滅亡',
  '欲望の空白',
]);

test('全10滅亡ルートに固有の番号と実在する画像を割り当てる', () => {
  const routes = Object.values(COLLAPSE_ROUTES);
  assert.deepEqual(Object.keys(COLLAPSE_VISUALS).sort(), [...routes].sort());
  assert.equal(new Set(Object.values(COLLAPSE_VISUALS).map(({ number }) => number)).size, 10);

  routes.forEach((route) => {
    const visual = getCollapseVisual(route);
    assert.ok(fs.existsSync(visual.image));
    assert.ok(visual.aspectRatio > 0);
    assert.ok(visual.imageLabel);
  });
});

test('01〜10の表示名が指定された正式名称と一致する', () => {
  const labelsByNumber = Object.entries(COLLAPSE_VISUALS)
    .sort(([, left], [, right]) => left.number.localeCompare(right.number))
    .map(([route]) => ENDING_CATALOG[route]?.label);

  assert.deepEqual(labelsByNumber, EXPECTED_LABELS);
});

test('通常エンドや不明な型には滅亡画像を表示しない', () => {
  assert.equal(getCollapseVisual('ironic_peace'), null);
  assert.equal(getCollapseVisual('unknown'), null);
});
