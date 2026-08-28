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
const MAX_DELTA_PER_CALL = 15;

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

/**
 * Apply a declaration score as a delta from the neutral score of 50.
 * Diminishing returns: the closer to the extreme, the smaller the effect.
 * Delta is also capped at MAX_DELTA_PER_CALL.
 */
function applyDesireScore(currentValue, declarationScore) {
  const current = clampDesireValue(currentValue);
  const score = clampDesireValue(declarationScore);
  let delta = score - DESIRE_NEUTRAL;

  // Cap the raw delta
  delta = Math.max(-MAX_DELTA_PER_CALL, Math.min(MAX_DELTA_PER_CALL, delta));

  // Diminishing returns: how much room is left toward the extreme
  const room = Math.min(1, delta > 0
    ? (DESIRE_MAX - current) / (DESIRE_MAX - DESIRE_NEUTRAL)
    : (current - DESIRE_MIN) / (DESIRE_NEUTRAL - DESIRE_MIN));

  const dampened = Math.round(delta * room);

  return clampDesireValue(current + dampened);
}

module.exports = {
  DESIRE_KEYS,
  DESIRE_MAX,
  DESIRE_MIN,
  DESIRE_NEUTRAL,
  MAX_DELTA_PER_CALL,
  applyDesireScore,
  clampDesireValue,
  normalizeDesireAxes,
};
