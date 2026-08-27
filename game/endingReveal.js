const {
  DESIRE_MAX: METER_MAX,
  DESIRE_MIN: METER_MIN,
  clampDesireValue,
} = require('./desireScale');

/**
 * 欲望軸の値を0〜100へ補正する。
 *
 * @param {number} value 欲望軸の最終値。
 * @returns {number} 0〜100に収めた値。
 */
function clampMeterValue(value) {
  return clampDesireValue(value, METER_MIN);
}

/**
 * 欲望軸の値を表示バー用の0〜100%へ変換する。
 *
 * @param {number} value 欲望軸の最終値。
 * @returns {number} 0〜100に収めた表示割合。
 */
function normalizeMeterValue(value) {
  const clampedValue = clampMeterValue(value);

  return ((clampedValue - METER_MIN) / (METER_MAX - METER_MIN)) * 100;
}

/**
 * アニメーションが正常完了した場合だけ、一度だけ外部へ通知する。
 *
 * @param {Function} [onComplete] 完了時のコールバック。
 * @returns {{ notify: Function, reset: Function }} 完了通知の制御オブジェクト。
 */
function createRevealCompletionNotifier(onComplete) {
  let didNotify = false;

  return {
    notify(finished) {
      if (!finished || didNotify) return false;

      didNotify = true;
      onComplete?.();
      return true;
    },
    reset() {
      didNotify = false;
    },
  };
}

module.exports = {
  METER_MIN,
  METER_MAX,
  clampMeterValue,
  createRevealCompletionNotifier,
  normalizeMeterValue,
};
