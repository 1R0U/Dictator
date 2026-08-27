// メーター加算ロジック
// 欲望マッピングの配点結果を累積し、各軸の現在値を更新する。

import { AXES, createInitialMeter } from '../data/axes';

const MIN_VALUE = -10;
const MAX_VALUE = 10;

/** 値を MIN_VALUE 〜 MAX_VALUE の範囲にクランプする。 */

function clamp(value) {
  return Math.max(MIN_VALUE, Math.min(MAX_VALUE, value));
}

/**
 * マッピング結果を現在のメーターに加算して新しいメーターを返す。
 * currentMeter も mappingResult も変更しない純粋関数。
 *
 * @param {Object} currentMeter  - { wealth: 0, power: 2, ... }
 * @param {Object} mappingResult - { wealth: 1, power: 3, ... }
 * @returns {Object} newMeter    - 加算後の値（上下限クランプ済み）
 */
export function applyMapping(currentMeter, mappingResult) {
  const newMeter = {};
  for (const axis of AXES) {
    const current = currentMeter[axis.key] ?? 0;
    const delta = mappingResult[axis.key] ?? 0;
    newMeter[axis.key] = clamp(current + delta);
  }
  return newMeter;
}

export { createInitialMeter };