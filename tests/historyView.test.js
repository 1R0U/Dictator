const test = require('node:test');
const assert = require('node:assert/strict');

const {
  UNKNOWN_ENDING_TITLE,
  UNKNOWN_SAVED_AT,
  createHistoryResult,
  formatHistoryDate,
  getHistoryAccessibilityLabel,
  getHistoryAdditionalDeclarations,
  getHistoryDeclarationSummary,
  getHistoryEndingBody,
  getHistoryPageCount,
  getHistoryPageItems,
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

test('結末の保存形式から履歴の再読込まで追加宣言を保持する', () => {
  const savedResult = createHistoryResult({
    declarationSummary: '休日を増やす',
    additionalDeclarations: [
      { milestoneKey: 'halfYear', declaration: '  週休三日にする  ' },
      { milestoneKey: 'year3', declaration: '祝日には菓子を配る' },
    ],
    desireAxes: { domination: 10, egoism: 20, innovation: 30, prestige: 40, madness: 50 },
    endingBody: '国は休日を楽しんだ。',
    endingType: 'ironic_peace',
    endingTitle: '休息の国',
    figureDiagnosis: null,
  });
  const [loadedResult] = normalizeHistoryResults([savedResult]);

  assert.deepEqual(loadedResult.additionalDeclarations, [
    { milestoneKey: 'halfYear', declaration: '週休三日にする' },
    { milestoneKey: 'year3', declaration: '祝日には菓子を配る' },
  ]);
});

test('履歴カードの読み上げに冒頭宣言とすべての追加宣言を含める', () => {
  assert.equal(
    getHistoryAccessibilityLabel(
      {
        declarationSummary: '休日を増やす',
        additionalDeclarations: [
          { milestoneKey: 'halfYear', declaration: '週休三日にする' },
          { milestoneKey: 'year3', declaration: '祝日には菓子を配る' },
        ],
      },
      '休息の国',
      '2026/08/27 12:00',
    ),
    '休息の国、2026/08/27 12:00、冒頭宣言「休日を増やす」、追加宣言「週休三日にする」、追加宣言「祝日には菓子を配る」',
  );
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

test('件数からページ数を算出する', () => {
  assert.equal(getHistoryPageCount([], 10), 1);
  assert.equal(getHistoryPageCount(new Array(10).fill({}), 10), 1);
  assert.equal(getHistoryPageCount(new Array(11).fill({}), 10), 2);
  assert.equal(getHistoryPageCount(new Array(20).fill({}), 10), 2);
  assert.equal(getHistoryPageCount(null, 10), 1);
});

test('指定ページに表示する要素だけを切り出す', () => {
  const results = Array.from({ length: 15 }, (_, i) => i);

  assert.deepEqual(getHistoryPageItems(results, 0, 10), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(getHistoryPageItems(results, 1, 10), [10, 11, 12, 13, 14]);
  assert.deepEqual(getHistoryPageItems(results, 2, 10), []);
  assert.deepEqual(getHistoryPageItems(null, 0, 10), []);
});

test('保存日時を日本語の一覧表示向けに整形する', () => {
  assert.equal(
    formatHistoryDate('2026-08-27T03:04:00.000Z', 'ja-JP', 'UTC'),
    '2026/08/27 03:04',
  );
  assert.equal(formatHistoryDate('invalid'), UNKNOWN_SAVED_AT);
  assert.equal(formatHistoryDate(null), UNKNOWN_SAVED_AT);
});
