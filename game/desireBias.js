// 欲望軸の偏りから偏見的・皮肉めいた一言コメントを生成するロジック（#72）。
const { DESIRE_KEYS, normalizeDesireAxes } = require('./desireScale');

const BIAS_HIGH_COMMENTS = Object.freeze({
  domination: '支配欲が振り切れているあなたは、鏡を見るたびに玉座を幻視しているタイプ。',
  egoism: '我欲が突出しているあなたは、分け前の計算だけは誰よりも速いタイプ。',
  innovation: '変革欲が突出しているあなたは、昨日の自分すら古臭いと切り捨てるタイプ。',
  prestige: '威信欲が突出しているあなたは、称賛されないと機嫌が直らないタイプ。',
  madness: '狂気が突出しているあなたは、正気の人間から見ると立派に見えるタイプ。',
});

const BIAS_LOW_COMMENTS = Object.freeze({
  domination: 'そのくせ支配欲は最下位。命令されるのは得意でも、するのは苦手なようです。',
  egoism: 'そのくせ我欲は最下位。損得勘定を忘れた瞬間に足元をすくわれるタイプです。',
  innovation: 'そのくせ変革欲は最下位。新しいものより、慣れた失敗を選ぶタイプです。',
  prestige: 'そのくせ威信欲は最下位。褒められても心のどこかで疑っているタイプです。',
  madness: 'そのくせ狂気は最下位。誰よりも冷静なのに、なぜか誰もついてこないタイプです。',
});

const BIAS_BALANCED_COMMENT =
  'すべての欲望が均等に育っているあなたは、逆にどこへ転ぶか誰にも読めないタイプです。';

/** Return the axis key with the highest (first) or lowest (last) value, ties broken by AXES order. */
function pickExtremeKey(normalized, comparator) {
  return DESIRE_KEYS.reduce((extremeKey, key) => (
    comparator(normalized[key], normalized[extremeKey]) ? key : extremeKey
  ), DESIRE_KEYS[0]);
}

/**
 * 欲望軸の最大・最小の偏りから、皮肉めいた一言コメントを生成する。
 *
 * @param {Object.<string, number>} desireAxes プレイ結果の最終欲望軸。
 * @returns {string} 偏見的な一言コメント。
 */
function getDesireBiasComment(desireAxes) {
  const normalized = normalizeDesireAxes(desireAxes);
  const highKey = pickExtremeKey(normalized, (value, extreme) => value > extreme);
  const lowKey = pickExtremeKey(normalized, (value, extreme) => value < extreme);

  if (highKey === lowKey) return BIAS_BALANCED_COMMENT;

  return `${BIAS_HIGH_COMMENTS[highKey]}${BIAS_LOW_COMMENTS[lowKey]}`;
}

module.exports = { BIAS_BALANCED_COMMENT, BIAS_HIGH_COMMENTS, BIAS_LOW_COMMENTS, getDesireBiasComment };
