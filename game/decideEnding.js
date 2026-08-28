// エンディング型の判定ロジック
// 最終メーターの値からエンディング型を決定論的に選ぶ。
// 上から順にチェックし、最初にマッチした型を返す。

/**
 * 最終メーターからエンディング型を判定する。
 *
 * @param {Object} finalMeter - { domination, egoism, innovation, prestige, madness }
 * @returns {string} エンディング型キー（greed / emptiness / ruin / ironic_peace / chaos）
 */
function decideEnding(finalMeter) {
  const m = {
    domination: finalMeter?.domination ?? 50,
    egoism: finalMeter?.egoism ?? 50,
    innovation: finalMeter?.innovation ?? 50,
    prestige: finalMeter?.prestige ?? 50,
    madness: finalMeter?.madness ?? 50,
  };

  // 1. 破滅：狂気が暴走
  if (m.madness >= 80) {
    return 'ruin';
  }

  // 2. 強欲：我欲と支配が両方高い
  if (m.egoism >= 80 && m.domination >= 60) {
    return 'greed';
  }

  // 3. 空虚：威信と変革が両方低い
  if (m.prestige <= 30 && m.innovation <= 30) {
    return 'emptiness';
  }

  // 4. 皮肉な平和：支配が高いが理性的
  if (m.domination >= 50 && m.madness <= 40 && m.egoism <= 60) {
    return 'ironic_peace';
  }

  // 5. 混沌：上記いずれにも該当しない
  return 'chaos';
}

module.exports = { decideEnding };
