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

const EXTINCTION_PATTERNS = Object.freeze([
  /(?:全(?:生物|生命|人類)|国民全員|全住民).{0,16}(?:根絶(?:した|された|し(?:、|て|$))|絶滅(?:した|させた|が確認された)|死亡した|死滅した|消滅した)/,
  /(?:人類|国民|住民).{0,12}(?:一人も|誰も).{0,8}(?:残っていない|生き残っていない)/,
]);
const OXYGEN_LOSS_PATTERNS = Object.freeze([
  /酸素.{0,14}(?:消失した|枯渇した|なくなった|失われ(?:た|、|て)|ゼロとなった|存在しない)/,
  /大気.{0,14}(?:呼吸不能|生命を維持できない)/,
]);

/** NEWS本文に確定した存続不能事象があれば、AIの控えめな数値評価を補正する。 */
function applyCatastrophicConsequences(news, stateDelta, collapseSignals) {
  const text = typeof news === 'string' ? news : '';
  const delta = normalizeNationStateDelta(stateDelta);
  const signals = normalizeCollapseSignals(collapseSignals);
  const hasExtinction = EXTINCTION_PATTERNS.some((pattern) => pattern.test(text));
  const hasOxygenLoss = OXYGEN_LOSS_PATTERNS.some((pattern) => pattern.test(text));

  if (hasExtinction) {
    delta.population = Math.min(delta.population, -100);
    delta.infrastructure = Math.min(delta.infrastructure, -75);
    delta.governance = Math.min(delta.governance, -75);
    delta.approval = Math.min(delta.approval, -75);
  }
  if (hasOxygenLoss) {
    delta.population = Math.min(delta.population, -100);
    delta.infrastructure = Math.min(delta.infrastructure, -100);
    signals.environmentalCollapse = true;
  }
  if (hasExtinction && /全(?:生物|生命)/.test(text)) {
    signals.environmentalCollapse = true;
  }

  return { stateDelta: delta, collapseSignals: signals };
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
  applyCatastrophicConsequences,
  COLLAPSE_SIGNALS_MARKER,
  COLLAPSE_SIGNAL_KEYS,
  STATE_DELTA_MARKER,
  getAssessmentStart,
  normalizeCollapseSignals,
  parseNationStateAssessment,
};
