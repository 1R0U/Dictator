// Nation-collapse scoring is intentionally independent from the desire profile.
// A dedicated collapse-axis system will replace these inert compatibility APIs.
const COLLAPSE_RISK_THRESHOLD = 100;
const COLLAPSE_ROUTES = Object.freeze({
  oppression: 'collapse_oppression',
  privatization: 'collapse_privatization',
  runawayReform: 'collapse_runaway_reform',
  prestigeWar: 'collapse_prestige_war',
  fanaticism: 'collapse_fanaticism',
  bloodyRevolution: 'collapse_bloody_revolution',
  goldenPalace: 'collapse_golden_palace',
  forbiddenCreation: 'collapse_forbidden_creation',
  quiet: 'collapse_quiet',
  void: 'collapse_void',
});
const AXIS_RISK_WEIGHTS = Object.freeze({});
const MILESTONE_RISK_WEIGHTS = Object.freeze([]);
const PRESSURE_KEYS = Object.freeze([]);

function normalizeCollapsePressure() {
  return {};
}

function advanceCollapseState() {
  return { pressure: {}, risk: 0 };
}

function advanceCollapseRisk() {
  return 0;
}

function determineCollapseRoute() {
  return null;
}

function shouldTriggerNationCollapse() {
  return false;
}

module.exports = {
  AXIS_RISK_WEIGHTS,
  COLLAPSE_RISK_THRESHOLD,
  COLLAPSE_ROUTES,
  MILESTONE_RISK_WEIGHTS,
  PRESSURE_KEYS,
  advanceCollapseRisk,
  advanceCollapseState,
  determineCollapseRoute,
  normalizeCollapsePressure,
  shouldTriggerNationCollapse,
};
