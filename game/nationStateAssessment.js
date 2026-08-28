const { normalizeNationStateDelta } = require('./nationState');

const STATE_DELTA_MARKER = '### STATE_DELTA';
const COLLAPSE_SIGNALS_MARKER = '### COLLAPSE_SIGNALS';
const COLLAPSE_SIGNAL_KEYS = Object.freeze([
  'defeatOccupation',
  'nuclearWar',
  'forbiddenFruit',
  'environmentalCollapse',
  'pandemicExtinction',
  'religiousStateRunaway',
  'aiTakeover',
]);

function normalizeCollapseSignals(signals) {
  return Object.fromEntries(COLLAPSE_SIGNAL_KEYS.map((key) => [key, signals?.[key] === true]));
}

function parseJsonValue(raw) {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  const fenced = trimmed.match(/```\s*(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim() ?? trimmed;
  try { return JSON.parse(fenced); } catch { return {}; }
}

function getAssessmentStart(text, afterIndex = -1) {
  const starts = [text.indexOf(STATE_DELTA_MARKER), text.indexOf(COLLAPSE_SIGNALS_MARKER)]
    .filter((index) => index > afterIndex);
  return starts.length ? Math.min(...starts) : text.length;
}

function parseNationStateAssessment(text) {
  const stateStart = text.indexOf(STATE_DELTA_MARKER);
  const signalStart = text.indexOf(COLLAPSE_SIGNALS_MARKER);
  const stateEnd = signalStart > stateStart ? signalStart : text.length;
  const stateRaw = stateStart >= 0
    ? text.substring(stateStart + STATE_DELTA_MARKER.length, stateEnd)
    : '';
  const signalsRaw = signalStart >= 0
    ? text.substring(signalStart + COLLAPSE_SIGNALS_MARKER.length)
    : '';

  return {
    stateDelta: normalizeNationStateDelta(parseJsonValue(stateRaw)),
    collapseSignals: normalizeCollapseSignals(parseJsonValue(signalsRaw)),
  };
}

module.exports = {
  COLLAPSE_SIGNALS_MARKER,
  COLLAPSE_SIGNAL_KEYS,
  STATE_DELTA_MARKER,
  getAssessmentStart,
  normalizeCollapseSignals,
  parseNationStateAssessment,
};
