// メーター加算ロジック
// 欲望マッピングの配点結果を累積し、各軸の現在値を更新する。

import { AXES, createInitialMeter } from '../data/axes';
import { applyDesireScore } from './desireScale';

/**
 * マッピング結果を現在のメーターに加算して新しいメーターを返す。
 * currentMeter も mappingResult も変更しない純粋関数。
 *
 * @param {Object} currentMeter  - { domination: -40, egoism: 70, ... }
 * @param {Object} mappingResult - 軸ごとの宣言評価（-100〜100、0が中立）。
 * @returns {Object} newMeter    - 宣言の方向を累積した値（-100〜100に補正済み）。
 */
export function applyMapping(currentMeter, mappingResult, progressionIndex = 0) {
  const newMeter = {};
  for (const axis of AXES) {
    newMeter[axis.key] = applyDesireScore(
      currentMeter?.[axis.key],
      mappingResult?.[axis.key],
      progressionIndex,
    );
  }
  return newMeter;
}

export { createInitialMeter };
