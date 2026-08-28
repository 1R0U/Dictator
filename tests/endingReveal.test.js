const test = require('node:test');
const assert = require('node:assert/strict');
const {
  METER_MAX,
  METER_MIN,
  clampMeterValue,
  createRevealCompletionNotifier,
  normalizeMeterValue,
} = require('../game/endingReveal');

test('双極値をメーター上の0〜100%へ変換する', () => {
  assert.equal(normalizeMeterValue(METER_MIN), 0);
  assert.equal(normalizeMeterValue(0), 50);
  assert.equal(normalizeMeterValue(METER_MAX), 100);
  assert.equal(normalizeMeterValue(undefined), 50);
});

test('表示値を-100〜100に補正する', () => {
  assert.equal(clampMeterValue(-101), -100);
  assert.equal(clampMeterValue(42), 42);
  assert.equal(clampMeterValue(101), 100);
  assert.equal(clampMeterValue(Number.NaN), 0);
});

test('正常完了時だけコールバックを一度呼び、リセットできる', () => {
  let count = 0;
  const notifier = createRevealCompletionNotifier(() => { count += 1; });
  assert.equal(notifier.notify(false), false);
  assert.equal(notifier.notify(true), true);
  assert.equal(notifier.notify(true), false);
  notifier.reset();
  assert.equal(notifier.notify(true), true);
  assert.equal(count, 2);
});
