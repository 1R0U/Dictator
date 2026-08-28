const { clampDesireValue } = require('./desireScale');

const DESIRE_LEVELS = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
});

const TRAIT_SENTENCES = Object.freeze({
  domination: Object.freeze({
    low: 'あなたの欲望は放任的で、混沌さえ受け入れます。',
    medium: 'あなたの欲望は秩序と均衡を求めています。',
    high: 'あなたの欲望は独裁的で、圧政へ傾いています。',
  }),
  egoism: Object.freeze({
    low: 'あなたの欲望は献身的で、自己犠牲をいといません。',
    medium: 'あなたの欲望は実利的で、合理性を重んじます。',
    high: 'あなたの欲望は貪欲で、暴君の気質を帯びています。',
  }),
  innovation: Object.freeze({
    low: 'あなたの欲望は停滞を選び、古い価値へ固執しています。',
    medium: 'あなたの欲望は保守的で、安定を望んでいます。',
    high: 'あなたの欲望は創世を志し、異端の変革へ進みます。',
  }),
  prestige: Object.freeze({
    low: 'あなたの欲望は迎合的で、軽蔑を招きかねません。',
    medium: 'あなたの欲望は威厳を保ち、尊敬を求めています。',
    high: 'あなたの欲望は畏怖をまとい、恐怖で人を従えます。',
  }),
  madness: Object.freeze({
    low: 'あなたの欲望は理性的で、平穏を保っています。',
    medium: 'あなたの欲望は偏執的で、妄信に近づいています。',
    high: 'あなたの欲望は破滅的で、狂信に支配されています。',
  }),
});

/** Each level's single best-fitting word within TRAIT_SENTENCES, used to highlight the sentence for display. */
const TRAIT_KEYWORDS = Object.freeze({
  domination: Object.freeze({
    low: Object.freeze(['放任的']),
    medium: Object.freeze(['秩序']),
    high: Object.freeze(['独裁的']),
  }),
  egoism: Object.freeze({
    low: Object.freeze(['献身的']),
    medium: Object.freeze(['実利的']),
    high: Object.freeze(['貪欲']),
  }),
  innovation: Object.freeze({
    low: Object.freeze(['停滞']),
    medium: Object.freeze(['保守的']),
    high: Object.freeze(['創世']),
  }),
  prestige: Object.freeze({
    low: Object.freeze(['迎合的']),
    medium: Object.freeze(['威厳']),
    high: Object.freeze(['畏怖']),
  }),
  madness: Object.freeze({
    low: Object.freeze(['理性的']),
    medium: Object.freeze(['偏執的']),
    high: Object.freeze(['破滅的']),
  }),
});

/** Return low (0–33), medium (34–66), or high (67–100). */
function getDesireLevel(value) {
  const normalized = clampDesireValue(value, 0);
  if (normalized <= 33) return DESIRE_LEVELS.LOW;
  if (normalized <= 66) return DESIRE_LEVELS.MEDIUM;
  return DESIRE_LEVELS.HIGH;
}

/** Return the concrete tendency sentence for an axis and value. */
function getDesireTraitSentence(axisKey, value) {
  const traits = TRAIT_SENTENCES[axisKey];
  return traits?.[getDesireLevel(value)] ?? 'この欲望の傾向は判定できません。';
}

/** Return the key word(s) to highlight within the trait sentence for an axis and value. */
function getDesireTraitKeywords(axisKey, value) {
  const keywords = TRAIT_KEYWORDS[axisKey];
  return keywords?.[getDesireLevel(value)] ?? [];
}

module.exports = {
  DESIRE_LEVELS,
  TRAIT_SENTENCES,
  TRAIT_KEYWORDS,
  getDesireLevel,
  getDesireTraitSentence,
  getDesireTraitKeywords,
};
