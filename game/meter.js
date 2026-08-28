// メーター加算ロジック
// 欲望マッピングの配点結果を累積し、各軸の現在値を更新する。
import { AXES, createInitialMeter } from '../data/axes';
import { applyDesireScore } from './desireScale';

/**
 * マッピング結果を現在のメーターに加算して新しいメーターを返す。
 * currentMeter も mappingResult も変更しない純粋関数。
 *
 * @param {Object} currentMeter  - { domination: 50, egoism: 70, ... }
 * @param {Object} mappingResult - 軸ごとの宣言評価（0〜100、50が中立）。
 * @param {number} [milestoneIndex=2] - 節目インデックス（0=初日, 4=1年後）
 * @returns {Object} newMeter    - 加算後の値（0〜100に補正済み）。
 */
export function applyMapping(currentMeter, mappingResult, milestoneIndex = 2) {
  const newMeter = {};
  for (const axis of AXES) {
    newMeter[axis.key] = applyDesireScore(
      currentMeter?.[axis.key],
      mappingResult?.[axis.key],
      milestoneIndex,
    );
  }
  return newMeter;
}

export { createInitialMeter };
