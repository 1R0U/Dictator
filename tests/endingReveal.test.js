const test = require('node:test');
const assert = require('node:assert/strict');

const {
  METER_MAX,
  METER_MIN,
  clampMeterValue,
  createRevealCompletionNotifier,
  normalizeMeterValue,
} = require('../game/endingReveal');

test('欲望軸の最小値・中間値・最大値をバーの割合へ変換する', () => {
  assert.equal(normalizeMeterValue(METER_MIN), 0);
  assert.equal(normalizeMeterValue(50), 50);
  assert.equal(normalizeMeterValue(METER_MAX), 100);
});

test('範囲外または不正な値を安全な表示割合へ変換する', () => {
  assert.equal(normalizeMeterValue(-100), 0);
  assert.equal(normalizeMeterValue(200), 100);
  assert.equal(normalizeMeterValue(undefined), 0);
});

test('表示値を0〜100に補正する', () => {
  assert.equal(clampMeterValue(-1), 0);
  assert.equal(clampMeterValue(42), 42);
  assert.equal(clampMeterValue(101), 100);
  assert.equal(clampMeterValue(Number.NaN), 0);
});

test('正常完了時だけコールバックを一度呼ぶ', () => {
  let callCount = 0;
  const notifier = createRevealCompletionNotifier(() => {
    callCount += 1;
  });

  assert.equal(notifier.notify(false), false);
  assert.equal(callCount, 0);
  assert.equal(notifier.notify(true), true);
  assert.equal(notifier.notify(true), false);
  assert.equal(callCount, 1);
});

test('新しいエンディング用に完了通知をリセットできる', () => {
  let callCount = 0;
  const notifier = createRevealCompletionNotifier(() => {
    callCount += 1;
  });

  notifier.notify(true);
  notifier.reset();
  notifier.notify(true);

  assert.equal(callCount, 2);
});
