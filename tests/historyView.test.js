const test = require('node:test');
const assert = require('node:assert/strict');

const {
  UNKNOWN_ENDING_TITLE,
  UNKNOWN_SAVED_AT,
  formatHistoryDate,
  getHistoryTitle,
  normalizeHistoryResults,
} = require('../game/historyView');

test('保存済みのエンディング見出しを一覧へ表示する', () => {
  assert.equal(getHistoryTitle({ endingTitle: '黄金色の静寂' }), '黄金色の静寂');
  assert.equal(getHistoryTitle({ endingTitle: '   ' }), UNKNOWN_ENDING_TITLE);
  assert.equal(getHistoryTitle({ endingTitle: 17 }), UNKNOWN_ENDING_TITLE);
});

test('normalizeHistoryResults handles empty and malformed stored values', () => {
  assert.deepEqual(normalizeHistoryResults(undefined), []);
  assert.deepEqual(normalizeHistoryResults('invalid'), []);
  assert.deepEqual(
    normalizeHistoryResults([
      null,
      [],
      { endingTitle: 'ending', savedAt: 17, declarationSummary: {} },
      7,
    ]),
    [{ endingTitle: 'ending', savedAt: '', declarationSummary: '' }],
  );
});

test('保存日時を日本語の一覧表示向けに整形する', () => {
  assert.equal(
    formatHistoryDate('2026-08-27T03:04:00.000Z', 'ja-JP', 'UTC'),
    '2026/08/27 03:04',
  );
  assert.equal(formatHistoryDate('invalid'), UNKNOWN_SAVED_AT);
  assert.equal(formatHistoryDate(null), UNKNOWN_SAVED_AT);
});
