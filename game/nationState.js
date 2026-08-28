const NATION_STATE_KEYS = Object.freeze([
  'population',
  'treasury',
  'infrastructure',
  'publicOrder',
  'governance',
  'approval',
]);

const INITIAL_NATION_STATE = Object.freeze(Object.fromEntries(
  NATION_STATE_KEYS.map((key) => [key, 70]),
));
const MIN_STATE_DELTA = -35;
const MAX_STATE_DELTA = 20;

function clampPercent(value, fallback = 70) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : fallback;
}

function clampDelta(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? Math.max(MIN_STATE_DELTA, Math.min(MAX_STATE_DELTA, Math.round(numeric)))
    : 0;
}

function normalizeNationState(state) {
  return Object.fromEntries(NATION_STATE_KEYS.map((key) => [
    key,
    clampPercent(state?.[key], INITIAL_NATION_STATE[key]),
  ]));
}

function normalizeNationStateDelta(delta) {
  return Object.fromEntries(NATION_STATE_KEYS.map((key) => [key, clampDelta(delta?.[key])]));
}

function applyNationStateDelta(previousState, delta) {
  const current = normalizeNationState(previousState);
  const normalizedDelta = normalizeNationStateDelta(delta);
  return Object.fromEntries(NATION_STATE_KEYS.map((key) => [
    key,
    clampPercent(current[key] + normalizedDelta[key]),
  ]));
}

module.exports = {
  INITIAL_NATION_STATE,
  MAX_STATE_DELTA,
  MIN_STATE_DELTA,
  NATION_STATE_KEYS,
  applyNationStateDelta,
  normalizeNationState,
  normalizeNationStateDelta,
};
