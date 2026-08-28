const test = require('node:test');
const assert = require('node:assert/strict');

const { extractMarkedSections } = require('../api/markedSections');

test('マーカーごとの本文を出現順に切り出す', () => {
  const text = '### TITLE\nタイトル本文\n### BODY\n本文\n複数行\n### STATS\n・A\n・B';
  const sections = extractMarkedSections(text, ['### TITLE', '### BODY', '### STATS']);

  assert.deepEqual(sections, ['タイトル本文', '本文\n複数行', '・A\n・B']);
});

test('マーカーが欠けていればnullを返す', () => {
  const text = '### TITLE\nタイトルのみ';
  assert.equal(extractMarkedSections(text, ['### TITLE', '### BODY']), null);
});

test('マーカーの出現順が期待と逆ならnullを返す', () => {
  const text = '### BODY\n本文\n### TITLE\nタイトル';
  assert.equal(extractMarkedSections(text, ['### TITLE', '### BODY']), null);
});

test('末尾マーカーの本文はテキスト終端まで含める', () => {
  const text = '### INTRO\n紹介文\n### BIAS\n偏見コメント';
  const sections = extractMarkedSections(text, ['### INTRO', '### BIAS']);

  assert.deepEqual(sections, ['紹介文', '偏見コメント']);
});
