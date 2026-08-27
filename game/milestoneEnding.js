const { normalizeDesireAxes } = require('./desireScale');

const COLLAPSE_RISK_THRESHOLD = 100;
const MILESTONE_RISK_WEIGHTS = Object.freeze([
  0.25, 0.35, 0.45, 0.6, 0.7, 0.85, 1, 1.15, 1.3, 1.5,
]);
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
const AXIS_RISK_WEIGHTS = Object.freeze({
  domination: 0.22,
  egoism: 0.18,
  innovation: 0.14,
  prestige: 0.12,
  madness: 0.25,
});
const PRESSURE_KEYS = Object.freeze([
  ...Object.keys(AXIS_RISK_WEIGHTS),
  'quiet',
  'void',
  'bloodyRevolution',
  'goldenPalace',
  'forbiddenCreation',
]);

function normalizeCollapsePressure(pressure) {
  return Object.fromEntries(PRESSURE_KEYS.map((key) => [
    key,
    Math.max(Number(pressure?.[key]) || 0, 0),
  ]));
}

/** Calculate hidden total risk and preserve which pressures accumulated it. */
function advanceCollapseState({
  previousRisk = 0,
  previousPressure,
  axes,
  previousAxes,
  milestoneIndex = 0,
}) {
  const current = normalizeDesireAxes(axes);
  const previous = normalizeDesireAxes(previousAxes);
  const pressure = normalizeCollapsePressure(previousPressure);
  const weight = MILESTONE_RISK_WEIGHTS[
    Math.min(Math.max(milestoneIndex, 0), MILESTONE_RISK_WEIGHTS.length - 1)
  ];
  let extremeRisk = 0;
  let suddenChangeRisk = 0;
  const axisContributions = {};
  Object.entries(AXIS_RISK_WEIGHTS).forEach(([key, axisWeight]) => {
    const extremeContribution = Math.max(current[key] - 65, 0) * axisWeight * weight;
    const changeContribution = previousAxes
      ? Math.abs(current[key] - previous[key]) * 0.08
      : 0;
    pressure[key] += extremeContribution + changeContribution;
    axisContributions[key] = extremeContribution + changeContribution;
    extremeRisk += extremeContribution;
    suddenChangeRisk += changeContribution;
  });
  const lowDesireRisk = Object.values(current).reduce(
    (sum, value) => sum + Math.max(25 - value, 0) * 0.12,
    0,
  ) * weight;
  const institutionalFatigueRisk = 9 * weight;
  const currentValues = Object.values(current);
  const balancedStagnationRisk = Math.max(...currentValues) <= 72
    && Math.max(...currentValues) - Math.min(...currentValues) <= 18
    ? 2 * weight
    : 0;
  pressure.void += lowDesireRisk;
  // Time alone raises the total risk, but must not overwrite the actual route cause.
  pressure.quiet += balancedStagnationRisk;
  if (current.domination >= 75 && current.madness >= 75) {
    pressure.bloodyRevolution += Math.min(
      axisContributions.domination,
      axisContributions.madness,
    ) * 1.8;
  }
  if (current.egoism >= 75 && current.prestige >= 75) {
    pressure.goldenPalace += Math.min(
      axisContributions.egoism,
      axisContributions.prestige,
    ) * 1.8;
  }
  if (current.innovation >= 75 && current.madness >= 75) {
    pressure.forbiddenCreation += Math.min(
      axisContributions.innovation,
      axisContributions.madness,
    ) * 1.8;
  }

  return {
    pressure,
    risk: Math.min(
      COLLAPSE_RISK_THRESHOLD,
      Math.round(
      (Number(previousRisk) || 0)
      + extremeRisk
      + lowDesireRisk
      + suddenChangeRisk
      + institutionalFatigueRisk
      + balancedStagnationRisk,
      ),
    ),
  };
}

/** Backwards-compatible scalar helper used by balance simulations. */
function advanceCollapseRisk(params) {
  return advanceCollapseState(params).risk;
}

/** Choose one of ten collapse routes from the axes that caused the threshold crossing. */
function determineCollapseRoute(axes, accumulatedPressure) {
  const values = normalizeDesireAxes(axes);
  const allValues = Object.values(values);
  const average = allValues.reduce((sum, value) => sum + value, 0) / allValues.length;
  const highestAxis = Object.entries(values).sort((a, b) => b[1] - a[1])[0][0];

  if (accumulatedPressure) {
    const pressure = normalizeCollapsePressure(accumulatedPressure);
    const routeScores = [
      [COLLAPSE_ROUTES.bloodyRevolution, pressure.bloodyRevolution],
      [COLLAPSE_ROUTES.goldenPalace, pressure.goldenPalace],
      [COLLAPSE_ROUTES.forbiddenCreation, pressure.forbiddenCreation],
      [COLLAPSE_ROUTES.oppression, pressure.domination],
      [COLLAPSE_ROUTES.privatization, pressure.egoism],
      [COLLAPSE_ROUTES.runawayReform, pressure.innovation],
      [COLLAPSE_ROUTES.prestigeWar, pressure.prestige],
      [COLLAPSE_ROUTES.fanaticism, pressure.madness],
      [COLLAPSE_ROUTES.quiet, pressure.quiet],
      [COLLAPSE_ROUTES.void, pressure.void],
    ];
    return routeScores.sort((a, b) => b[1] - a[1])[0][0];
  }

  if (values.domination >= 75 && values.madness >= 75) return COLLAPSE_ROUTES.bloodyRevolution;
  if (values.egoism >= 75 && values.prestige >= 75) return COLLAPSE_ROUTES.goldenPalace;
  if (values.innovation >= 75 && values.madness >= 75) return COLLAPSE_ROUTES.forbiddenCreation;
  if (average <= 32) return COLLAPSE_ROUTES.void;
  if (Math.max(...allValues) <= 72) return COLLAPSE_ROUTES.quiet;

  return {
    domination: COLLAPSE_ROUTES.oppression,
    egoism: COLLAPSE_ROUTES.privatization,
    innovation: COLLAPSE_ROUTES.runawayReform,
    prestige: COLLAPSE_ROUTES.prestigeWar,
    madness: COLLAPSE_ROUTES.fanaticism,
  }[highestAxis];
}

function shouldTriggerNationCollapse(risk) {
  return Number(risk) >= COLLAPSE_RISK_THRESHOLD;
}

module.exports = {
  AXIS_RISK_WEIGHTS,
  COLLAPSE_RISK_THRESHOLD,
  COLLAPSE_ROUTES,
  MILESTONE_RISK_WEIGHTS,
  PRESSURE_KEYS,
  advanceCollapseState,
  advanceCollapseRisk,
  determineCollapseRoute,
  normalizeCollapsePressure,
  shouldTriggerNationCollapse,
};
