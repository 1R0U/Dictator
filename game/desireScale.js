const DESIRE_KEYS = Object.freeze([
  'domination',
  'egoism',
  'innovation',
  'prestige',
  'madness',
]);
const DESIRE_MIN = 0;
const DESIRE_MAX = 100;
const DESIRE_NEUTRAL = 50;

/** Clamp a desire value to the shared 0–100 scale. */
function clampDesireValue(value, fallback = DESIRE_NEUTRAL) {
  const numericValue = Number.isFinite(value) ? value : fallback;
  return Math.max(DESIRE_MIN, Math.min(DESIRE_MAX, Math.round(numericValue)));
}

/** Normalize all five desire axes to safe values on the shared scale. */
function normalizeDesireAxes(axes, fallback = DESIRE_NEUTRAL) {
  return Object.fromEntries(
    DESIRE_KEYS.map((key) => [key, clampDesireValue(axes?.[key], fallback)]),
  );
}

/** Apply a declaration score as a delta from the neutral score of 50. */
function applyDesireScore(currentValue, declarationScore) {
  const current = clampDesireValue(currentValue);
  const score = clampDesireValue(declarationScore);
  return clampDesireValue(current + (score - DESIRE_NEUTRAL));
}

module.exports = {
  DESIRE_KEYS,
  DESIRE_MAX,
  DESIRE_MIN,
  DESIRE_NEUTRAL,
  applyDesireScore,
  clampDesireValue,
  normalizeDesireAxes,
};
