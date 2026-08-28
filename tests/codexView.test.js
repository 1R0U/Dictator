const test = require('node:test');
const assert = require('node:assert/strict');

require.extensions['.png'] = (module, filename) => {
  module.exports = filename;
};
require.extensions['.jpg'] = (module, filename) => {
  module.exports = filename;
};

const {
  applyCodexUnlock,
  buildCollapseCodexEntries,
  buildFigureCodexEntries,
  normalizeCodexCategory,
  normalizeCodexState,
} = require('../game/codexView');
const { COLLAPSE_VISUALS } = require('../data/collapseVisuals');
const { FIGURES } = require('../data/figures');

test('applyCodexUnlock: 未解放から解放すると1回目としてtimesSeenとfirstSeenAtを刻む', () => {
  const entry = applyCodexUnlock(null, '2026-08-01T00:00:00.000Z');
  assert.deepEqual(entry, { timesSeen: 1, firstSeenAt: '2026-08-01T00:00:00.000Z' });
});

test('applyCodexUnlock: 再遭遇するとtimesSeenだけ増え、firstSeenAtは変わらない', () => {
  const first = applyCodexUnlock(null, '2026-08-01T00:00:00.000Z');
  const second = applyCodexUnlock(first, '2026-08-10T00:00:00.000Z');
  assert.deepEqual(second, { timesSeen: 2, firstSeenAt: '2026-08-01T00:00:00.000Z' });
});

test('applyCodexUnlock: 日時未指定でも現在時刻を補って解放できる', () => {
  const entry = applyCodexUnlock(null, undefined);
  assert.equal(entry.timesSeen, 1);
  assert.ok(entry.firstSeenAt);
  assert.ok(!Number.isNaN(new Date(entry.firstSeenAt).getTime()));
});

test('normalizeCodexCategory: 壊れた・不正な形式のエントリは除外する', () => {
  assert.deepEqual(
    normalizeCodexCategory({
      valid: { timesSeen: 3, firstSeenAt: '2026-08-01T00:00:00.000Z' },
      noTimesSeen: { firstSeenAt: '2026-08-01T00:00:00.000Z' },
      zeroTimes: { timesSeen: 0, firstSeenAt: '2026-08-01T00:00:00.000Z' },
      noFirstSeen: { timesSeen: 2, firstSeenAt: '' },
      notObject: 'nope',
      isArray: [],
    }),
    { valid: { timesSeen: 3, firstSeenAt: '2026-08-01T00:00:00.000Z' } },
  );
});

test('normalizeCodexState: 未知の値やカテゴリ数に依存せず素通しで正規化する', () => {
  assert.deepEqual(normalizeCodexState(undefined), {});
  assert.deepEqual(normalizeCodexState('invalid'), {});
  assert.deepEqual(
    normalizeCodexState({
      collapse: { collapse_oppression: { timesSeen: 1, firstSeenAt: '2026-08-01T00:00:00.000Z' } },
      figure: { caesar: { timesSeen: 2, firstSeenAt: '2026-08-02T00:00:00.000Z' } },
      futureCategory: { someKey: { timesSeen: 1, firstSeenAt: '2026-08-03T00:00:00.000Z' } },
    }),
    {
      collapse: { collapse_oppression: { timesSeen: 1, firstSeenAt: '2026-08-01T00:00:00.000Z' } },
      figure: { caesar: { timesSeen: 2, firstSeenAt: '2026-08-02T00:00:00.000Z' } },
      futureCategory: { someKey: { timesSeen: 1, firstSeenAt: '2026-08-03T00:00:00.000Z' } },
    },
  );
});

test('buildCollapseCodexEntries: COLLAPSE_VISUALS全件を番号順に並べ、解放状態を合成する', () => {
  const codexState = {
    collapse: { collapse_oppression: { timesSeen: 2, firstSeenAt: '2026-08-01T00:00:00.000Z' } },
  };
  const entries = buildCollapseCodexEntries(codexState);

  assert.equal(entries.length, Object.keys(COLLAPSE_VISUALS).length);
  assert.deepEqual(entries.map((entry) => entry.number), entries.map((entry) => entry.number).slice().sort());

  const unlocked = entries.find((entry) => entry.key === 'collapse_oppression');
  assert.equal(unlocked.unlocked, true);
  assert.equal(unlocked.timesSeen, 2);
  assert.equal(unlocked.label, '圧政崩壊');

  const locked = entries.find((entry) => entry.key === 'collapse_void');
  assert.equal(locked.unlocked, false);
  assert.equal(locked.timesSeen, 0);
  assert.equal(locked.firstSeenAt, null);
});

test('buildCollapseCodexEntries: 未知の値やカテゴリ未保存でも全件ロック状態で返す', () => {
  const entries = buildCollapseCodexEntries({});
  assert.equal(entries.length, Object.keys(COLLAPSE_VISUALS).length);
  assert.ok(entries.every((entry) => entry.unlocked === false));
});

test('buildFigureCodexEntries: FIGURES全件を登録順に並べ、解放状態を合成する', () => {
  const firstFigureKey = FIGURES[0].key;
  const codexState = {
    figure: { [firstFigureKey]: { timesSeen: 5, firstSeenAt: '2026-08-05T00:00:00.000Z' } },
  };
  const entries = buildFigureCodexEntries(codexState);

  assert.equal(entries.length, FIGURES.length);
  assert.equal(entries[0].key, firstFigureKey);
  assert.equal(entries[0].number, '01');
  assert.equal(entries[0].unlocked, true);
  assert.equal(entries[0].timesSeen, 5);
  assert.deepEqual(entries[0].pattern, FIGURES[0].pattern);
  assert.equal(entries[1].unlocked, false);
});
