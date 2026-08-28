const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

require.extensions['.png'] = (module, filename) => { module.exports = filename; };
require.extensions['.jpg'] = (module, filename) => { module.exports = filename; };

const { COLLAPSE_ROUTES } = require('../game/milestoneEnding');
const { COLLAPSE_VISUALS, getCollapseVisual } = require('../data/collapseVisuals');
const { ENDING_CATALOG } = require('../data/endingCatalog');

const EXPECTED_LABELS = Object.freeze([
  '国民消滅・大量国外脱出', '国家破産', '社会機能停止', '無政府状態', '政府機能崩壊',
  '独裁者失脚', '革命・クーデター', '国家分裂・全面内戦', '飢餓', '経済崩壊・行政崩壊',
  '暴動・略奪', '国家総崩壊', '敗戦・占領', '核戦争', '禁断の果実', '環境崩壊',
  '疫病による滅亡', '宗教国家の暴走', 'AIによる統治権奪取',
]);

test('全19滅亡ルートに固有の連番と実在する画像を割り当てる', () => {
  const routes = Object.values(COLLAPSE_ROUTES);
  assert.equal(routes.length, 19);
  assert.deepEqual(Object.keys(COLLAPSE_VISUALS).sort(), [...routes].sort());
  assert.deepEqual(
    Object.values(COLLAPSE_VISUALS).map(({ number }) => number).sort(),
    Array.from({ length: 19 }, (_, index) => String(index + 1).padStart(2, '0')),
  );

  routes.forEach((route) => {
    const visual = getCollapseVisual(route);
    assert.ok(fs.existsSync(visual.image));
    assert.ok(visual.aspectRatio > 0);
    assert.ok(visual.imageLabel);
    assert.ok(ENDING_CATALOG[route]);
  });
});

test('01〜19の表示名が指定された正式名称と一致する', () => {
  const labelsByNumber = Object.entries(COLLAPSE_VISUALS)
    .sort(([, left], [, right]) => left.number.localeCompare(right.number))
    .map(([route]) => ENDING_CATALOG[route]?.label);
  assert.deepEqual(labelsByNumber, EXPECTED_LABELS);
});

test('通常エンドや不明な型には滅亡画像を表示しない', () => {
  assert.equal(getCollapseVisual('ironic_peace'), null);
  assert.equal(getCollapseVisual('unknown'), null);
  assert.equal(getCollapseVisual('constructor'), null);
  assert.equal(getCollapseVisual('__proto__'), null);
});
