/** Decide whether the one-shot collapse announcement should start. */
function shouldStartCollapseIntro({
  enabled,
  endingType,
  hasCollapseVisual,
  playedEndingType,
}) {
  return Boolean(
    enabled
    && hasCollapseVisual
    && endingType
    && playedEndingType !== endingType,
  );
}

module.exports = { shouldStartCollapseIntro };
