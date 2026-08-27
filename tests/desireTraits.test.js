const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DESIRE_LEVELS,
  getDesireLevel,
  getDesireTraitKeywords,
  getDesireTraitSentence,
} = require('../game/desireTraits');

test('欲望値を低・中・高の境界で分類する', () => {
  assert.equal(getDesireLevel(0), DESIRE_LEVELS.LOW);
  assert.equal(getDesireLevel(33), DESIRE_LEVELS.LOW);
  assert.equal(getDesireLevel(34), DESIRE_LEVELS.MEDIUM);
  assert.equal(getDesireLevel(66), DESIRE_LEVELS.MEDIUM);
  assert.equal(getDesireLevel(67), DESIRE_LEVELS.HIGH);
  assert.equal(getDesireLevel(100), DESIRE_LEVELS.HIGH);
});

test('軸と数値帯に応じた具体的な傾向文を返す', () => {
  assert.equal(
    getDesireTraitSentence('domination', 90),
    'あなたの欲望は独裁的で、圧政へ傾いています。',
  );
  assert.equal(
    getDesireTraitSentence('madness', 10),
    'あなたの欲望は理性的で、平穏を保っています。',
  );
});

test('5軸すべてに低・中・高の異なる傾向文がある', () => {
  const axisKeys = ['domination', 'egoism', 'innovation', 'prestige', 'madness'];

  for (const axisKey of axisKeys) {
    const sentences = [
      getDesireTraitSentence(axisKey, 10),
      getDesireTraitSentence(axisKey, 50),
      getDesireTraitSentence(axisKey, 90),
    ];
    assert.equal(new Set(sentences).size, 3);
    assert.ok(sentences.every((sentence) => sentence.startsWith('あなたの欲望は')));
  }
});

test('強調キーワードは各傾向文に実在し、軸ごとに1語だけ持つ', () => {
  const axisKeys = ['domination', 'egoism', 'innovation', 'prestige', 'madness'];
  const values = [10, 50, 90];

  for (const axisKey of axisKeys) {
    for (const value of values) {
      const sentence = getDesireTraitSentence(axisKey, value);
      const keywords = getDesireTraitKeywords(axisKey, value);

      assert.equal(keywords.length, 1);
      assert.ok(sentence.includes(keywords[0]));
    }
  }
});
