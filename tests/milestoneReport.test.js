const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REPORT_SIDES,
  getReportContent,
} = require('../game/milestoneReport');

const report = {
  news: '表向きのニュース',
  memo: '裏側の側近メモ',
};

test('NEWS面ではgenerateBeatのnews本文を表示する', () => {
  assert.equal(getReportContent(REPORT_SIDES.NEWS, report), report.news);
});

test('MEMO面ではgenerateBeatのmemo本文を表示する', () => {
  assert.equal(getReportContent(REPORT_SIDES.MEMO, report), report.memo);
});
