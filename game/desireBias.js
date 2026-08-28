const { DESIRE_KEYS, normalizeDesireAxes } = require('./desireScale');

const BIAS_COMMENTS = Object.freeze({
  domination: Object.freeze({ left: '気に入らないものを世界から消せば整うと思いがちな、排除先行型です。', right: '地図を見ると空白より国境の向こう側が気になる、征服先行型です。' }),
  egoism: Object.freeze({ left: '明日の国庫より今夜の宴を優先しがちな、享楽先行型です。', right: '共有という言葉を「まだ自分のものではない」と読む、独占先行型です。' }),
  innovation: Object.freeze({ left: '設計図を描く前に解体用ハンマーを持つ、破壊先行型です。', right: '動いている制度まで分解して組み直したくなる、改造先行型です。' }),
  prestige: Object.freeze({ left: '拍手より沈黙を忠誠の証だと思う、畏怖先行型です。', right: '支持率より祭壇の高さが気になる、崇拝先行型です。' }),
  madness: Object.freeze({ left: '一つの答えを信じるほど他の答えが見えなくなる、狂信先行型です。', right: '予定通りに進むと物足りなくなる、混沌先行型です。' }),
});
const BIAS_BALANCED_COMMENT = 'どの方向にもまだ染まり切っていません。次の宣言で人格が決まりそうです。';

function getDesireBiasComment(desireAxes) {
  const normalized = normalizeDesireAxes(desireAxes);
  const strongestKey = DESIRE_KEYS.reduce((best, key) => (
    Math.abs(normalized[key]) > Math.abs(normalized[best]) ? key : best
  ), DESIRE_KEYS[0]);
  const value = normalized[strongestKey];
  if (Math.abs(value) < 20) return BIAS_BALANCED_COMMENT;
  return BIAS_COMMENTS[strongestKey][value < 0 ? 'left' : 'right'];
}

module.exports = {
  BIAS_BALANCED_COMMENT,
  BIAS_COMMENTS,
  getDesireBiasComment,
};
