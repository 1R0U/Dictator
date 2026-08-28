const { applyNationStateDelta, normalizeNationState } = require('./nationState');

const COLLAPSE_RISK_THRESHOLD = 100;
const COLLAPSE_ROUTES = Object.freeze({
  citizenDisappearance: 'collapse_citizen_disappearance',
  nationalBankruptcy: 'collapse_national_bankruptcy',
  socialFunctionsHalt: 'collapse_social_functions_halt',
  anarchy: 'collapse_anarchy',
  governmentCollapse: 'collapse_government_collapse',
  dictatorOverthrown: 'collapse_dictator_overthrown',
  revolutionCoup: 'collapse_revolution_coup',
  civilWarPartition: 'collapse_civil_war_partition',
  famine: 'collapse_famine',
  economicAdministrativeCollapse: 'collapse_economic_administrative',
  riotsLooting: 'collapse_riots_looting',
  totalNationalCollapse: 'collapse_total_national',
  defeatOccupation: 'collapse_defeat_occupation',
  nuclearWar: 'collapse_nuclear_war',
  forbiddenFruit: 'collapse_forbidden_fruit',
  environmentalCollapse: 'collapse_environmental',
  pandemicExtinction: 'collapse_pandemic',
  religiousStateRunaway: 'collapse_religious_state',
  aiTakeover: 'collapse_ai_takeover',
});
const SPECIAL_SIGNAL_ROUTES = Object.freeze([
  ['nuclearWar', COLLAPSE_ROUTES.nuclearWar],
  ['forbiddenFruit', COLLAPSE_ROUTES.forbiddenFruit],
  ['aiTakeover', COLLAPSE_ROUTES.aiTakeover],
  ['religiousStateRunaway', COLLAPSE_ROUTES.religiousStateRunaway],
  ['environmentalCollapse', COLLAPSE_ROUTES.environmentalCollapse],
  ['pandemicExtinction', COLLAPSE_ROUTES.pandemicExtinction],
  ['defeatOccupation', COLLAPSE_ROUTES.defeatOccupation],
]);
const AXIS_RISK_WEIGHTS = Object.freeze({});
const MILESTONE_RISK_WEIGHTS = Object.freeze([]);
const PRESSURE_KEYS = Object.freeze(Object.keys(normalizeNationState()));

function normalizeCollapsePressure(pressure) {
  return normalizeNationState(pressure);
}

function advanceCollapseState({ previousPressure, stateDelta } = {}) {
  const pressure = applyNationStateDelta(previousPressure, stateDelta);
  const lowestState = Math.min(...Object.values(pressure));
  return { pressure, risk: 100 - lowestState };
}

function advanceCollapseRisk(params) {
  return advanceCollapseState(params).risk;
}

/** 特殊事象を優先し、その後に具体的な複合条件、単独0%条件の順で判定する。 */
function determineCollapseRoute(state, signals = {}) {
  for (const [signal, route] of SPECIAL_SIGNAL_ROUTES) {
    if (signals?.[signal] === true) return route;
  }

  const current = normalizeNationState(state);
  const { population, treasury, infrastructure, publicOrder, governance, approval } = current;
  const criticalCount = Object.values(current).filter((value) => value <= 20).length;

  if (criticalCount >= 4) return COLLAPSE_ROUTES.totalNationalCollapse;
  if ((publicOrder <= 20 && governance <= 25) || (governance <= 25 && approval <= 25)) {
    return COLLAPSE_ROUTES.civilWarPartition;
  }
  if (approval <= 25 && (publicOrder <= 25 || governance <= 30)) {
    return COLLAPSE_ROUTES.revolutionCoup;
  }
  if (population <= 35 && infrastructure <= 20) return COLLAPSE_ROUTES.famine;
  if (treasury <= 20 && (infrastructure <= 25 || governance <= 25)) {
    return COLLAPSE_ROUTES.economicAdministrativeCollapse;
  }
  if (population <= 30 && approval <= 20) return COLLAPSE_ROUTES.citizenDisappearance;
  if (infrastructure <= 20 && publicOrder <= 25) return COLLAPSE_ROUTES.riotsLooting;
  if (population <= 0) return COLLAPSE_ROUTES.citizenDisappearance;
  if (treasury <= 0) return COLLAPSE_ROUTES.nationalBankruptcy;
  if (infrastructure <= 0) return COLLAPSE_ROUTES.socialFunctionsHalt;
  if (publicOrder <= 0) return COLLAPSE_ROUTES.anarchy;
  if (governance <= 0) return COLLAPSE_ROUTES.governmentCollapse;
  if (approval <= 0) return COLLAPSE_ROUTES.dictatorOverthrown;
  return null;
}

function shouldTriggerNationCollapse(state, signals) {
  return Boolean(determineCollapseRoute(state, signals));
}

module.exports = {
  AXIS_RISK_WEIGHTS,
  COLLAPSE_RISK_THRESHOLD,
  COLLAPSE_ROUTES,
  MILESTONE_RISK_WEIGHTS,
  PRESSURE_KEYS,
  SPECIAL_SIGNAL_ROUTES,
  advanceCollapseRisk,
  advanceCollapseState,
  determineCollapseRoute,
  normalizeCollapsePressure,
  shouldTriggerNationCollapse,
};
