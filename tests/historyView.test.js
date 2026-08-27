const test = require('node:test');
const assert = require('node:assert/strict');

const {
  UNKNOWN_ENDING_TITLE,
  UNKNOWN_SAVED_AT,
  formatHistoryDate,
  getHistoryAdditionalDeclarations,
  getHistoryDeclarationSummary,
  getHistoryEndingBody,
  getHistoryEndingTypeLabel,
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
    [{
      additionalDeclarations: [],
      declarationSummary: '',
      desireAxes: { domination: 0, egoism: 0, innovation: 0, madness: 0, prestige: 0 },
      endingBody: '',
      endingTitle: 'ending',
      savedAt: '',
    }],
  );
});

test('追加宣言を履歴表示向けに正規化する', () => {
  const result = {
    additionalDeclarations: [
      null,
      'invalid',
      { milestoneKey: 'month1', declaration: '  休日を増やす  ' },
      { milestoneKey: 12, declaration: '祝日には菓子を配る' },
      { milestoneKey: 'year1', declaration: '   ' },
    ],
  };

  assert.deepEqual(getHistoryAdditionalDeclarations(result), [
    { milestoneKey: 'month1', declaration: '休日を増やす' },
    { milestoneKey: '', declaration: '祝日には菓子を配る' },
  ]);
  assert.deepEqual(getHistoryAdditionalDeclarations({}), []);
});

test('履歴詳細の本文は保存値または宣言概要から再構成する', () => {
  assert.equal(
    getHistoryEndingBody({ endingBody: '保存された結末。' }),
    '保存された結末。',
  );
  assert.equal(
    getHistoryEndingBody({ endingType: 'ruin', declarationSummary: '無視される宣言' }),
    '独裁者の欲望は国の限界を超えた。インフラは崩壊し、経済は破綻し、最後の閣僚は辞表をFAXで送ってきた。FAXも壊れていた。',
  );
  assert.equal(
    getHistoryEndingBody({ declarationSummary: 'パンを無料にする' }),
    '「パンを無料にする」から始まった国の、記録された結末。',
  );
});

test('履歴詳細に冒頭宣言の要約を安全に表示する', () => {
  assert.equal(
    getHistoryDeclarationSummary({ declarationSummary: '  パンを無料にする  ' }),
    'パンを無料にする',
  );
  assert.equal(getHistoryDeclarationSummary({ declarationSummary: 18 }), '記録に残されていない宣言');
});

test('履歴詳細に保存済みのエンディング型を表示する', () => {
  assert.equal(getHistoryEndingTypeLabel({ endingType: 'ironic_peace' }), '皮肉な平和');
  assert.equal(getHistoryEndingTypeLabel({ endingType: 'unknown' }), '分類不明');
});

test('保存日時を日本語の一覧表示向けに整形する', () => {
  assert.equal(
    formatHistoryDate('2026-08-27T03:04:00.000Z', 'ja-JP', 'UTC'),
    '2026/08/27 03:04',
  );
  assert.equal(formatHistoryDate('invalid'), UNKNOWN_SAVED_AT);
  assert.equal(formatHistoryDate(null), UNKNOWN_SAVED_AT);
});
