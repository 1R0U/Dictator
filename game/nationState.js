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

function clampPercent(value, fallback = 70) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : fallback;
}

function clampDelta(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
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
  NATION_STATE_KEYS,
  applyNationStateDelta,
  normalizeNationState,
  normalizeNationStateDelta,
};
