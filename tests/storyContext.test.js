const test = require('node:test');
const assert = require('node:assert/strict');

const { getPreviousMilestoneEvents } = require('../game/storyContext');

const milestones = [
  { key: 'day1', label: '初日' },
  { key: 'week1', label: '1週間後' },
  { key: 'month1', label: '1か月後' },
];

test('現在より前の生成済みレポートを節目順で返す', () => {
  const reports = {
    week1: { news: '週のニュース', memo: '週のメモ' },
    day1: { news: '初日のニュース', memo: '初日のメモ' },
  };

  assert.deepEqual(getPreviousMilestoneEvents(milestones, reports, 2), [
    { milestoneLabel: '初日', news: '初日のニュース', memo: '初日のメモ' },
    { milestoneLabel: '1週間後', news: '週のニュース', memo: '週のメモ' },
  ]);
});

test('現在以降のレポートと未生成の節目は含めない', () => {
  const reports = {
    day1: { news: '初日のニュース', memo: '初日のメモ' },
    month1: { news: '未来のニュース', memo: '未来のメモ' },
  };

  assert.deepEqual(getPreviousMilestoneEvents(milestones, reports, 2), [
    { milestoneLabel: '初日', news: '初日のニュース', memo: '初日のメモ' },
  ]);
});

test('空白のレポートは物語コンテキストへ含めない', () => {
  assert.deepEqual(getPreviousMilestoneEvents(milestones, {
    day1: { news: '   ', memo: '' },
  }, 1), []);
});
