const test = require('node:test');
const assert = require('node:assert/strict');
const { getAssessmentStart, parseNationStateAssessment } = require('../game/nationStateAssessment');

test('AI応答から国家状態の変化量と特殊滅亡信号を分離する', () => {
  const text = '### MEMO\n秘密の報告\n### STATE_DELTA\n{"population":-12,"treasury":8,"approval":-50}\n### COLLAPSE_SIGNALS\n{"nuclearWar":true,"aiTakeover":false}';
  const assessment = parseNationStateAssessment(text);
  assert.deepEqual(assessment.stateDelta, { population: -12, treasury: 8, infrastructure: 0, publicOrder: 0, governance: 0, approval: -35 });
  assert.equal(assessment.collapseSignals.nuclearWar, true);
  assert.equal(assessment.collapseSignals.aiTakeover, false);
  assert.equal(getAssessmentStart(text, text.indexOf('### MEMO')), text.indexOf('### STATE_DELTA'));
});

test('評価JSONが欠損または壊れていても全軸変化なし・全信号falseにする', () => {
  const assessment = parseNationStateAssessment('### STATE_DELTA\nnot-json');
  assert.deepEqual(assessment.stateDelta, { population: 0, treasury: 0, infrastructure: 0, publicOrder: 0, governance: 0, approval: 0 });
  assert.ok(Object.values(assessment.collapseSignals).every((value) => value === false));
});
