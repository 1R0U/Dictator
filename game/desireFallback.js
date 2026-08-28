const { DESIRE_KEYS, DESIRE_NEUTRAL, clampDesireValue } = require('./desireScale');

const AXIS_SIGNALS = Object.freeze({
  domination: Object.freeze({
    left: Object.freeze(['排除', '追放', '粛清', '隔離', '禁止', '根絶']),
    right: Object.freeze(['征服', '侵略', '領土', '服従', '支配下', '占領']),
  }),
  egoism: Object.freeze({
    left: Object.freeze(['享楽', '快楽', '贅沢', '宴', '遊ぶ', '浪費']),
    right: Object.freeze(['独占', '私物化', '所有', '買い占め', '自分だけ', '総取り']),
  }),
  innovation: Object.freeze({
    left: Object.freeze(['破壊', '廃止', '解体', '壊す', '焼き払う', '白紙']),
    right: Object.freeze(['改造', '改革', '再設計', '作り替える', '改善', '刷新']),
  }),
  prestige: Object.freeze({
    left: Object.freeze(['畏怖', '恐怖', '威圧', '恐れ', '逆らえない', '震え上がる']),
    right: Object.freeze(['崇拝', '信奉', '称賛', '敬愛', '神格化', '讃える']),
  }),
  madness: Object.freeze({
    left: Object.freeze(['狂信', '教義', '絶対視', '盲信', '異端', '信仰']),
    right: Object.freeze(['混沌', '無秩序', '予測不能', 'でたらめ', '無作為', '気まぐれ']),
  }),
});

function createFallbackMapping(declaration) {
  const text = typeof declaration === 'string' ? declaration.toLowerCase() : '';
  return Object.fromEntries(DESIRE_KEYS.map((key) => {
    const signals = AXIS_SIGNALS[key];
    const leftMatches = signals.left.filter((keyword) => text.includes(keyword)).length;
    const rightMatches = signals.right.filter((keyword) => text.includes(keyword)).length;
    if (leftMatches + rightMatches === 0) return [key, DESIRE_NEUTRAL];
    const direction = ((rightMatches - leftMatches) / (leftMatches + rightMatches)) * 70;
    return [key, clampDesireValue(direction)];
  }));
}

module.exports = { AXIS_SIGNALS, createFallbackMapping };
