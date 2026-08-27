const { DESIRE_KEYS, DESIRE_NEUTRAL, clampDesireValue } = require('./desireScale');

const AXIS_SIGNALS = Object.freeze({
  domination: Object.freeze({
    high: Object.freeze(['独裁', '圧政', '命令', '支配', '統制', '服従', '軍', '警察', 'dictatorship', 'oppression']),
    medium: Object.freeze(['秩序', '均衡', '規律', '管理', 'order', 'balance']),
    low: Object.freeze(['放任', '混沌', '自由', '自治', '無政府', 'laissez-faire', 'chaos']),
  }),
  egoism: Object.freeze({
    high: Object.freeze(['我欲', '貪欲', '暴君', '私利', '独占', '贅沢', 'greed', 'tyrant']),
    medium: Object.freeze(['実利', '合理', '利益', '効率', 'practical', 'rational']),
    low: Object.freeze(['献身', '犠牲', '奉仕', '寄付', '分配', '無償', 'devotion', 'sacrifice']),
  }),
  innovation: Object.freeze({
    high: Object.freeze(['創世', '異端', '変革', '改革', '革命', '創造', '発明', '刷新', 'innovation', 'revolution']),
    medium: Object.freeze(['保守', '安定', '維持', '伝統', 'conservative', 'stability']),
    low: Object.freeze(['停滞', '固執', '現状', '退行', 'stagnation', 'rigid']),
  }),
  prestige: Object.freeze({
    high: Object.freeze(['畏怖', '恐怖', '威圧', '震撼', 'fear', 'dread']),
    medium: Object.freeze(['威信', '威厳', '尊敬', '名誉', 'prestige', 'respect']),
    low: Object.freeze(['迎合', '軽蔑', '屈服', '卑屈', '不名誉', 'contempt', 'appease']),
  }),
  madness: Object.freeze({
    high: Object.freeze(['破滅', '狂信', '狂気', '極端', '無謀', '虐殺', 'madness', 'fanatic']),
    medium: Object.freeze(['偏執', '妄信', '執着', '盲信', 'paranoia', 'delusion']),
    low: Object.freeze(['理性', '平穏', '冷静', '慎重', '対話', 'reason', 'calm']),
  }),
});

/**
 * APIを利用できない場合に、宣言文を軸ごとの語彙で独立評価する。
 * 一致しない軸は中立の50とし、低・中・高の根拠を平均して配点する。
 */
function createFallbackMapping(declaration) {
  const text = typeof declaration === 'string' ? declaration.toLowerCase() : '';

  return Object.fromEntries(
    DESIRE_KEYS.map((key) => {
      const signals = AXIS_SIGNALS[key];
      const matchedScores = [
        ...signals.low.filter((keyword) => text.includes(keyword)).map(() => 15),
        ...signals.medium.filter((keyword) => text.includes(keyword)).map(() => 50),
        ...signals.high.filter((keyword) => text.includes(keyword)).map(() => 85),
      ];
      const score = matchedScores.length > 0
        ? matchedScores.reduce((sum, value) => sum + value, 0) / matchedScores.length
        : DESIRE_NEUTRAL;
      return [key, clampDesireValue(score)];
    }),
  );
}

module.exports = { AXIS_SIGNALS, createFallbackMapping };
