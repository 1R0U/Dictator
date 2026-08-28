const { clampDesireValue } = require('./desireScale');

const DESIRE_LEVELS = Object.freeze({
  EXTREME_LEFT: 'extremeLeft', LEFT: 'left', CENTER: 'center',
  RIGHT: 'right', EXTREME_RIGHT: 'extremeRight',
});
const POLE_LABELS = Object.freeze({
  domination: Object.freeze({ left: '排除', right: '征服' }),
  egoism: Object.freeze({ left: '享楽', right: '独占' }),
  innovation: Object.freeze({ left: '破壊', right: '改造' }),
  prestige: Object.freeze({ left: '畏怖', right: '崇拝' }),
  madness: Object.freeze({ left: '狂信', right: '混沌' }),
});
const TRAIT_SENTENCES = Object.freeze({
  domination: Object.freeze({ left: '異物を排除し、内側の純度を守ろうとします。', center: '排除にも征服にも偏らず、支配の形を定めかねています。', right: '境界を越えて征服し、影響圏を広げようとします。' }),
  egoism: Object.freeze({ left: '今この瞬間の享楽を求め、欲望を消費します。', center: '享楽にも独占にも偏らず、欲望の行き先を探しています。', right: '富や権利を独占し、自分だけのものにしようとします。' }),
  innovation: Object.freeze({ left: '既存の仕組みを破壊し、白紙へ戻そうとします。', center: '破壊にも改造にも偏らず、現状を見定めています。', right: '仕組みを作り替え、国家を意図した形へ改造します。' }),
  prestige: Object.freeze({ left: '人々に畏怖を刻み、逆らえない威信を求めます。', center: '畏怖にも崇拝にも偏らず、評価との距離を保っています。', right: '人々から崇拝され、象徴として仰がれることを求めます。' }),
  madness: Object.freeze({ left: '一つの信念へ狂信し、他の可能性を閉ざします。', center: '狂信にも混沌にも偏らず、理性の境界に留まっています。', right: '秩序そのものを拒み、予測不能な混沌へ傾きます。' }),
});
const TRAIT_KEYWORDS = Object.freeze({
  domination: Object.freeze({ left: Object.freeze(['排除']), center: Object.freeze(['偏らず']), right: Object.freeze(['征服']) }),
  egoism: Object.freeze({ left: Object.freeze(['享楽']), center: Object.freeze(['偏らず']), right: Object.freeze(['独占']) }),
  innovation: Object.freeze({ left: Object.freeze(['破壊']), center: Object.freeze(['偏らず']), right: Object.freeze(['改造']) }),
  prestige: Object.freeze({ left: Object.freeze(['畏怖']), center: Object.freeze(['偏らず']), right: Object.freeze(['崇拝']) }),
  madness: Object.freeze({ left: Object.freeze(['狂信']), center: Object.freeze(['偏らず']), right: Object.freeze(['混沌']) }),
});

function getDesireLevel(value) {
  const normalized = clampDesireValue(value);
  if (normalized <= -70) return DESIRE_LEVELS.EXTREME_LEFT;
  if (normalized <= -30) return DESIRE_LEVELS.LEFT;
  if (normalized >= 70) return DESIRE_LEVELS.EXTREME_RIGHT;
  if (normalized >= 30) return DESIRE_LEVELS.RIGHT;
  return DESIRE_LEVELS.CENTER;
}

function getBaseDirection(level) {
  if (level === DESIRE_LEVELS.EXTREME_LEFT) return DESIRE_LEVELS.LEFT;
  if (level === DESIRE_LEVELS.EXTREME_RIGHT) return DESIRE_LEVELS.RIGHT;
  return level;
}

function getDesireTendencyLabel(axisKey, value) {
  const poles = POLE_LABELS[axisKey];
  if (!poles) return '判定不能';
  const level = getDesireLevel(value);
  if (level === DESIRE_LEVELS.EXTREME_LEFT) return `非常に強い${poles.left}傾向`;
  if (level === DESIRE_LEVELS.LEFT) return `${poles.left}寄り`;
  if (level === DESIRE_LEVELS.EXTREME_RIGHT) return `非常に強い${poles.right}傾向`;
  if (level === DESIRE_LEVELS.RIGHT) return `${poles.right}寄り`;
  return '中立・混在';
}

function getDesireTraitSentence(axisKey, value) {
  return TRAIT_SENTENCES[axisKey]?.[getBaseDirection(getDesireLevel(value))] ?? 'この欲望の方向は判定できません。';
}

function getDesireTraitKeywords(axisKey, value) {
  return TRAIT_KEYWORDS[axisKey]?.[getBaseDirection(getDesireLevel(value))] ?? [];
}

module.exports = { DESIRE_LEVELS, TRAIT_KEYWORDS, TRAIT_SENTENCES, getDesireLevel, getDesireTendencyLabel, getDesireTraitKeywords, getDesireTraitSentence };
