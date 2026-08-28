const COLLAPSE_STATE_LABELS = Object.freeze({
  population: '人口',
  treasury: '財源',
  infrastructure: '生活基盤',
  publicOrder: '治安',
  governance: '統治力',
  approval: '支持率',
});

const WARNING_LEVELS = Object.freeze({
  CAUTION: 'caution',
  DANGER: 'danger',
  IMMINENT: 'imminent',
});

const WARNING_COPY = Object.freeze({
  population: Object.freeze({
    caution: '陛下、各地で人口の減少が目立ち始めています。このままでは国を支える者が足りなくなります。',
    danger: '陛下、民が急速に国から消えています。都市も農村も維持できなくなる日は遠くありません。',
    imminent: '陛下、もはや国民がほとんど残っておりません。次の決断を誤れば、この国は無人となります。',
  }),
  treasury: Object.freeze({
    caution: '陛下、国庫の余裕が失われつつあります。これ以上の支出は国家運営そのものを圧迫します。',
    danger: '陛下、国庫は底を突く寸前です。行政も軍も、まもなく維持できなくなります。',
    imminent: '陛下、支払える金が残っておりません。国家破産は目前です。',
  }),
  infrastructure: Object.freeze({
    caution: '陛下、水道、電力、交通などの生活基盤に深刻な傷みが出ています。',
    danger: '陛下、国民の日常を支える仕組みが次々と止まっています。社会全体の停止が迫っています。',
    imminent: '陛下、生活基盤は限界です。あと一押しで社会機能が完全に停止します。',
  }),
  publicOrder: Object.freeze({
    caution: '陛下、街では犯罪と小規模な暴動が増えています。治安部隊だけでは抑えきれなくなりつつあります。',
    danger: '陛下、政府の秩序が街から失われています。暴動と武装勢力が急速に広がっています。',
    imminent: '陛下、法はもはや機能しておりません。無政府状態へ転落する寸前です。',
  }),
  governance: Object.freeze({
    caution: '陛下、命令が地方や官僚組織まで届かなくなり始めています。統治機構に綻びがあります。',
    danger: '陛下、政府内部の離反と機能停止が進んでいます。国家を動かせる時間は残りわずかです。',
    imminent: '陛下、政府は崩壊寸前です。今や命令を実行できる者すら残っておりません。',
  }),
  approval: Object.freeze({
    caution: '陛下、民衆の不満が目に見えて高まっています。忠誠を当然と思うのは危険です。',
    danger: '陛下、民衆だけでなく側近や軍にも離反の兆しがあります。政権転覆の危険があります。',
    imminent: '陛下、玉座を支える者はほぼ残っておりません。失脚は目前です。',
  }),
});

function normalizeStateValue(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : null;
}

function getWarningLevel(value) {
  if (value <= 10) return WARNING_LEVELS.IMMINENT;
  if (value <= 25) return WARNING_LEVELS.DANGER;
  if (value <= 40) return WARNING_LEVELS.CAUTION;
  return null;
}

/** 数値を公開せず、最も危険な国家指標について側近の警告を返す。 */
function getCollapseWarning(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null;

  const dangerous = Object.keys(COLLAPSE_STATE_LABELS)
    .map((key) => ({ key, value: normalizeStateValue(state[key]) }))
    .filter(({ value }) => value !== null && value <= 40)
    .sort((left, right) => left.value - right.value)[0];

  if (!dangerous) return null;
  const level = getWarningLevel(dangerous.value);
  return Object.freeze({
    axis: dangerous.key,
    axisLabel: COLLAPSE_STATE_LABELS[dangerous.key],
    level,
    message: WARNING_COPY[dangerous.key][level],
  });
}

module.exports = {
  COLLAPSE_STATE_LABELS,
  WARNING_LEVELS,
  getCollapseWarning,
};
