// 欲望軸パターンが最も近い歴史上の人物を選出するロジック（#72）。
const { DESIRE_KEYS, clampDesireValue, normalizeDesireAxes } = require('./desireScale');
const { FIGURES } = require('../data/figures');

/** Euclidean distance between two 5-axis desire patterns. */
function computeDesireDistance(desireAxes, pattern) {
  return Math.sqrt(
    DESIRE_KEYS.reduce((sum, key) => {
      const diff = clampDesireValue(desireAxes?.[key]) - clampDesireValue(pattern?.[key]);
      return sum + diff * diff;
    }, 0),
  );
}

/**
 * プレイ結果の欲望軸と最も近い人物を1名選出する。
 *
 * @param {Object.<string, number>} desireAxes プレイ結果の最終欲望軸。
 * @param {Object[]} [figures] 候補人物データセット。
 * @returns {{ figure: Object, distance: number } | null} 最も近い人物と距離。候補が無い場合はnull。
 */
function matchFigure(desireAxes, figures = FIGURES) {
  if (!Array.isArray(figures) || figures.length === 0) return null;

  const normalized = normalizeDesireAxes(desireAxes);
  let bestFigure = null;
  let bestDistance = Infinity;

  for (const figure of figures) {
    const distance = computeDesireDistance(normalized, figure.pattern);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestFigure = figure;
    }
  }

  return bestFigure ? { figure: bestFigure, distance: bestDistance } : null;
}

module.exports = { computeDesireDistance, matchFigure };
