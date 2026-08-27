// 50年後の節目で「国の滅亡」エンドへ分岐すべきか判定する。
// エンディング型の本判定ロジック（#6/#25）が実装され次第、そちらに置き換える前提の仮の閾値判定。
const { normalizeDesireAxes } = require('./desireScale');

const NATION_COLLAPSE_THRESHOLD = 80;
const NATION_COLLAPSE_AXIS_KEYS = Object.freeze(['domination', 'madness']);

/**
 * 支配・狂気のいずれかが閾値以上なら、50年を待たず国が滅亡したとみなす。
 *
 * @param {Object.<string, number>} desireAxes 現在の欲望軸。
 * @returns {boolean} 「国の滅亡」エンドへ分岐すべき場合はtrue。
 */
function shouldTriggerNationCollapse(desireAxes) {
  const normalized = normalizeDesireAxes(desireAxes);
  return NATION_COLLAPSE_AXIS_KEYS.some((key) => normalized[key] >= NATION_COLLAPSE_THRESHOLD);
}

module.exports = {
  NATION_COLLAPSE_AXIS_KEYS,
  NATION_COLLAPSE_THRESHOLD,
  shouldTriggerNationCollapse,
};
