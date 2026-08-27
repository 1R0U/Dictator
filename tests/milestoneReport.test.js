const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REPORT_SIDES,
  REPORT_STATUS,
  getReportContent,
  getReportStatus,
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

test('generateBeat呼び出し中はLOADING状態になる', () => {
  assert.equal(
    getReportStatus({ isLoading: true, isFallback: false }),
    REPORT_STATUS.LOADING,
  );
});

test('ローディング中はフォールバック判定より優先される', () => {
  assert.equal(
    getReportStatus({ isLoading: true, isFallback: true }),
    REPORT_STATUS.LOADING,
  );
});

test('フォールバック本文を受け取った場合はFALLBACK状態になる', () => {
  assert.equal(
    getReportStatus({ isLoading: false, isFallback: true }),
    REPORT_STATUS.FALLBACK,
  );
});

test('通常時はREADY状態になる', () => {
  assert.equal(
    getReportStatus({ isLoading: false, isFallback: false }),
    REPORT_STATUS.READY,
  );
});

test('引数省略時もREADY状態になる', () => {
  assert.equal(getReportStatus(), REPORT_STATUS.READY);
});
