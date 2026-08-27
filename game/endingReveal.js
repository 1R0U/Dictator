const METER_MIN = 0;
const METER_MAX = 100;

/**
 * 欲望軸の値を0〜100へ補正する。
 *
 * @param {number} value 欲望軸の最終値。
 * @returns {number} 0〜100に収めた値。
 */
function clampMeterValue(value) {
  const numericValue = Number.isFinite(value) ? value : 0;

  return Math.max(METER_MIN, Math.min(METER_MAX, numericValue));
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
