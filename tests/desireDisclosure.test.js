const test = require('node:test');
const assert = require('node:assert/strict');

const { redactDesireDisclosure } = require('../game/desireDisclosure');

test('英語の軸名と内部段階を生成文から除去する', () => {
  const text = '改革が進んだ。domination:very-high、egoism = low。';
  const result = redactDesireDisclosure(text);

  assert.doesNotMatch(result, /domination|egoism|very-high|low/i);
  assert.match(result, /改革が進んだ/);
});

test('日本語の軸名に結び付いた数値だけを除去する', () => {
  const text = '支配：91、威信は70点。支持者10万人が広場に集まった。';
  const result = redactDesireDisclosure(text);

  assert.doesNotMatch(result, /支配\s*[：:]?\s*91|威信は70/);
  assert.match(result, /支持者10万人/);
});

test('欲望メーターを説明する文を除去して具体的な出来事を残す', () => {
  const text = '欲望メーターは狂気80％です。工場が12棟閉鎖された。';
  const result = redactDesireDisclosure(text);

  assert.doesNotMatch(result, /欲望メーター|狂気80/);
  assert.match(result, /工場が12棟閉鎖された/);
});

test('空値や文字列以外を安全に処理する', () => {
  assert.equal(redactDesireDisclosure(''), '');
  assert.equal(redactDesireDisclosure(null), '');
});
