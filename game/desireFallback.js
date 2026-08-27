const { DESIRE_KEYS, DESIRE_NEUTRAL, clampDesireValue } = require('./desireScale');

const AXIS_SIGNALS = Object.freeze({
  wealth: Object.freeze({
    increase: Object.freeze(['金', '富', '財産', '国庫', '経済', '給料', '賃金', '土地', '所有', 'money', 'wealth']),
    decrease: Object.freeze(['貧困', '没収', '破産', '無一文', 'poverty', 'bankrupt']),
  }),
  power: Object.freeze({
    increase: Object.freeze(['権力', '命令', '支配', '統制', '禁止', '義務', '服従', '軍', '警察', '罰', '独裁', 'control', 'obey']),
    decrease: Object.freeze(['自由', '自治', '民主', '選挙', '解放', 'freedom', 'democracy']),
  }),
  fame: Object.freeze({
    increase: Object.freeze(['名声', '有名', '称賛', '名誉', '宣伝', '広告', '人気', '英雄', '記念', '表彰', 'fame', 'famous']),
    decrease: Object.freeze(['匿名', '無名', '忘却', '不名誉', 'anonymous', 'obscure']),
  }),
  love: Object.freeze({
    increase: Object.freeze(['愛', '恋', '家族', '結婚', '夫婦', '友情', '絆', '共生', 'love', 'family']),
    decrease: Object.freeze(['憎', '差別', '排除', '孤独', '分断', '男女', '迫害', 'hate', 'discrimination']),
  }),
  pleasure: Object.freeze({
    increase: Object.freeze(['快楽', '娯楽', '遊', '酒', '祭', 'ゲーム', '休暇', '楽しい', '笑', '宴', 'pleasure', 'entertainment']),
    decrease: Object.freeze(['禁止', '禁欲', '苦痛', '我慢', '労働', '処罰', '苦行', 'abstinence', 'suffering']),
  }),
});

/**
 * APIを利用できない場合に、宣言文を軸ごとの語彙で独立評価する。
 * 一致しない軸は中立の50とし、一致語が多い軸だけを強める。
 */
function createFallbackMapping(declaration) {
  const text = typeof declaration === 'string' ? declaration.toLowerCase() : '';

  return Object.fromEntries(
    DESIRE_KEYS.map((key) => {
      const signals = AXIS_SIGNALS[key];
      const increases = signals.increase.filter((keyword) => text.includes(keyword)).length;
      const decreases = signals.decrease.filter((keyword) => text.includes(keyword)).length;
      return [key, clampDesireValue(DESIRE_NEUTRAL + ((increases - decreases) * 15))];
    }),
  );
}

module.exports = { AXIS_SIGNALS, createFallbackMapping };
