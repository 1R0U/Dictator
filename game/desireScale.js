const DESIRE_KEYS = Object.freeze(['domination', 'egoism', 'innovation', 'prestige', 'madness']);
const DESIRE_MIN = -100;
const DESIRE_MAX = 100;
const DESIRE_NEUTRAL = 0;
const DESIRE_SCALE_VERSION = 2;
const MAX_DELTA_PER_CALL = 25;
// 宣言①〜④の最大加算量を25・30・35・40に固定する。
const PROGRESSION_MULTIPLIERS = Object.freeze([1, 1.2, 1.4, 1.6]);
const SKIP_NEUTRAL_STEP = 5;

function clampDesireValue(value, fallback = DESIRE_NEUTRAL) {
  const numericValue = Number.isFinite(value) ? value : fallback;
  return Math.max(DESIRE_MIN, Math.min(DESIRE_MAX, Math.round(numericValue)));
}

function normalizeDesireAxes(axes, fallback = DESIRE_NEUTRAL) {
  return Object.fromEntries(DESIRE_KEYS.map(
    (key) => [key, clampDesireValue(axes?.[key], fallback)],
  ));
}

function convertLegacyDesireAxes(axes) {
  return Object.fromEntries(DESIRE_KEYS.map((key) => {
    const legacyValue = Number.isFinite(axes?.[key]) ? axes[key] : 50;
    return [key, clampDesireValue((legacyValue - 50) * 2)];
  }));
}

function roundSignedValue(value) {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** 宣言内容を、宣言①として扱った場合の加算値へ変換する。 */
function calculateBaseDeclarationDelta(declarationScore) {
  const score = clampDesireValue(declarationScore);
  return roundSignedValue(score * (MAX_DELTA_PER_CALL / DESIRE_MAX));
}

function applyDesireScore(currentValue, declarationScore, progressionIndex = 0) {
  const current = clampDesireValue(currentValue);
  const baseDelta = calculateBaseDeclarationDelta(declarationScore);
  const multiplier = PROGRESSION_MULTIPLIERS[
    Math.max(0, Math.min(PROGRESSION_MULTIPLIERS.length - 1, progressionIndex))
  ];
  const delta = roundSignedValue(baseDelta * multiplier);
  return clampDesireValue(current + delta);
}

function moveDesireAxesTowardNeutral(axes, step = SKIP_NEUTRAL_STEP) {
  const neutralStep = Math.max(0, Math.round(Number(step) || 0));
  const current = normalizeDesireAxes(axes);

  return Object.fromEntries(DESIRE_KEYS.map((key) => {
    const value = current[key];
    if (value > 0) return [key, Math.max(DESIRE_NEUTRAL, value - neutralStep)];
    if (value < 0) return [key, Math.min(DESIRE_NEUTRAL, value + neutralStep)];
    return [key, DESIRE_NEUTRAL];
  }));
}

module.exports = {
  DESIRE_KEYS,
  DESIRE_MAX,
  DESIRE_MIN,
  DESIRE_NEUTRAL,
  DESIRE_SCALE_VERSION,
  MAX_DELTA_PER_CALL,
  PROGRESSION_MULTIPLIERS,
  SKIP_NEUTRAL_STEP,
  applyDesireScore,
  calculateBaseDeclarationDelta,
  clampDesireValue,
  convertLegacyDesireAxes,
  moveDesireAxesTowardNeutral,
  normalizeDesireAxes,
};
