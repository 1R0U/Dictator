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

// 節目ごとの変化倍率：序盤は緩やか、終盤は大きく
const PROGRESSION_MULTIPLIERS = Object.freeze([
  0.4,  // 初日
  0.6,  // 1週間後
  0.8,  // 1か月後
  1.0,  // 半年後
  1.3,  // 1年後
]);

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
 * - progressionIndex controls how much effect this call has (0=early, 4=late).
 * - Diminishing returns prevent values from hitting extremes too easily.
 * - Delta is capped at ±MAX_DELTA_PER_CALL before scaling.
 *
 * @param {number} currentValue - 現在の軸の値
 * @param {number} declarationScore - AIが返した配点（0-100、50が中立）
 * @param {number} [progressionIndex=2] - 節目インデックス（0-4）
 */
function applyDesireScore(currentValue, declarationScore, progressionIndex = 2) {
  const current = clampDesireValue(currentValue);
  const score = clampDesireValue(declarationScore);
  let delta = score - DESIRE_NEUTRAL;

  // Cap the raw delta
  delta = Math.max(-MAX_DELTA_PER_CALL, Math.min(MAX_DELTA_PER_CALL, delta));

  // Apply progression multiplier (early = small, late = large)
  const multiplier = PROGRESSION_MULTIPLIERS[
    Math.max(0, Math.min(PROGRESSION_MULTIPLIERS.length - 1, progressionIndex))
  ];
  delta = Math.round(delta * multiplier);

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
  PROGRESSION_MULTIPLIERS,
  applyDesireScore,
  clampDesireValue,
  normalizeDesireAxes,
};
