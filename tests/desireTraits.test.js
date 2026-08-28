const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DESIRE_LEVELS,
  getDesireLevel,
  getDesireTendencyLabel,
  getDesireTraitKeywords,
  getDesireTraitSentence,
} = require('../game/desireTraits');

test('双極値を極端・傾向・中央の5段階へ分類する', () => {
  assert.equal(getDesireLevel(-70), DESIRE_LEVELS.EXTREME_LEFT);
  assert.equal(getDesireLevel(-69), DESIRE_LEVELS.LEFT);
  assert.equal(getDesireLevel(-30), DESIRE_LEVELS.LEFT);
  assert.equal(getDesireLevel(-29), DESIRE_LEVELS.CENTER);
  assert.equal(getDesireLevel(29), DESIRE_LEVELS.CENTER);
  assert.equal(getDesireLevel(30), DESIRE_LEVELS.RIGHT);
  assert.equal(getDesireLevel(69), DESIRE_LEVELS.RIGHT);
  assert.equal(getDesireLevel(70), DESIRE_LEVELS.EXTREME_RIGHT);
});

test('結果表示用に軸の方向名を含む傾向ラベルを返す', () => {
  assert.equal(getDesireTendencyLabel('domination', -72), '非常に強い排除傾向');
  assert.equal(getDesireTendencyLabel('egoism', -35), '享楽寄り');
  assert.equal(getDesireTendencyLabel('innovation', 0), '中立・混在');
  assert.equal(getDesireTendencyLabel('prestige', 42), '崇拝寄り');
  assert.equal(getDesireTendencyLabel('madness', 88), '非常に強い混沌傾向');
});

test('5軸すべてに左右と中央の異なる説明がある', () => {
  for (const key of ['domination', 'egoism', 'innovation', 'prestige', 'madness']) {
    const values = [-80, 0, 80];
    const sentences = values.map((value) => getDesireTraitSentence(key, value));
    assert.equal(new Set(sentences).size, 3);
    values.forEach((value) => {
      const keywords = getDesireTraitKeywords(key, value);
      assert.equal(keywords.length, 1);
      assert.ok(getDesireTraitSentence(key, value).includes(keywords[0]));
    });
  }
});
