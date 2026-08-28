const { normalizeDesireAxes } = require('./desireScale');

/** Select a normal ending from the direction and intensity of the bipolar axes. */
function decideEnding(finalMeter) {
  const meter = normalizeDesireAxes(finalMeter);
  const magnitudes = Object.values(meter).map(Math.abs);

  if (Math.abs(meter.madness) >= 75) return 'ruin';
  if (meter.egoism >= 65 && meter.domination >= 40) return 'greed';
  if (Math.max(...magnitudes) <= 20) return 'emptiness';
  if (meter.domination >= 35 && meter.madness <= -25 && meter.egoism <= 45) {
    return 'ironic_peace';
  }
  return 'chaos';
}

module.exports = { decideEnding };
