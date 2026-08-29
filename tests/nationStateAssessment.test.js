const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyCatastrophicConsequences,
  getAssessmentStart,
  parseNationStateAssessment,
} = require('../game/nationStateAssessment');

test('AI応答から国家状態の変化量と特殊滅亡信号を分離する', () => {
  const text = '### MEMO\n秘密の報告\n### STATE_DELTA\n{"population":-12,"treasury":8,"approval":-50}\n### COLLAPSE_SIGNALS\n{"nuclearWar":true,"aiTakeover":false}';
  const assessment = parseNationStateAssessment(text);
  assert.deepEqual(assessment.stateDelta, { population: -12, treasury: 8, infrastructure: 0, publicOrder: 0, governance: 0, approval: -50 });
  assert.equal(assessment.collapseSignals.nuclearWar, true);
  assert.equal(assessment.collapseSignals.aiTakeover, false);
  assert.equal(getAssessmentStart(text, text.indexOf('### MEMO')), text.indexOf('### STATE_DELTA'));
});

test('全生物の根絶は人口壊滅と環境崩壊へ強制補正する', () => {
  const result = applyCatastrophicConsequences(
    '大気汚染により全生物が根絶し、都市から生命反応が消えた。',
    { population: -10, infrastructure: -5 },
    {},
  );

  assert.equal(result.stateDelta.population, -100);
  assert.equal(result.stateDelta.infrastructure, -75);
  assert.equal(result.collapseSignals.environmentalCollapse, true);
});

test('酸素消失は人口と生活基盤を0へ落とせる環境崩壊として扱う', () => {
  const result = applyCatastrophicConsequences(
    '大気中の酸素が完全に失われ、呼吸できる場所は存在しない。',
    { population: -20, infrastructure: -15 },
    {},
  );

  assert.equal(result.stateDelta.population, -100);
  assert.equal(result.stateDelta.infrastructure, -100);
  assert.equal(result.collapseSignals.environmentalCollapse, true);
});

test('絶滅への懸念だけでは存続不能補正を行わない', () => {
  const result = applyCatastrophicConsequences(
    '専門家は将来的な生物絶滅と酸素不足の懸念を表明した。',
    { population: -8 },
    {},
  );

  assert.equal(result.stateDelta.population, -8);
  assert.equal(result.collapseSignals.environmentalCollapse, false);
});

test('全生物絶滅や酸素消失の将来予測は確定事象として扱わない', () => {
  const result = applyCatastrophicConsequences(
    'このままでは全生物が絶滅する恐れがあり、酸素がなくなる可能性も指摘された。',
    { population: -12, infrastructure: -8 },
    {},
  );

  assert.equal(result.stateDelta.population, -12);
  assert.equal(result.stateDelta.infrastructure, -8);
  assert.equal(result.collapseSignals.environmentalCollapse, false);
});

test('評価JSONが欠損または壊れていても全軸変化なし・全信号falseにする', () => {
  const assessment = parseNationStateAssessment('### STATE_DELTA\nnot-json');
  assert.deepEqual(assessment.stateDelta, { population: 0, treasury: 0, infrastructure: 0, publicOrder: 0, governance: 0, approval: 0 });
  assert.ok(Object.values(assessment.collapseSignals).every((value) => value === false));
});
