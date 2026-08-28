const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REPORT_SIDES,
  REPORT_STATUS,
  SPEECH_RATES,
  SPEECH_MODE_OFF,
  getReportContent,
  getReportStatus,
  getNextSpeechMode,
  isMilestoneReportPending,
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

test('非検診の未生成レポートは初回描画からローディング扱いにする', () => {
  assert.equal(isMilestoneReportPending({
    isLoading: false,
    showCheckup: false,
    report: undefined,
  }), true);
});

test('読み上げモードは読み上げなし→×1→×2→読み上げなしと巡回する', () => {
  assert.equal(getNextSpeechMode(SPEECH_MODE_OFF), SPEECH_RATES[0]);
  assert.equal(getNextSpeechMode(SPEECH_RATES[0]), SPEECH_RATES[1]);
  assert.equal(getNextSpeechMode(SPEECH_RATES[1]), SPEECH_MODE_OFF);
});

test('未知の速度値を渡した場合は読み上げなしへ戻す', () => {
  assert.equal(getNextSpeechMode(999), SPEECH_MODE_OFF);
});

test('生成済みレポートまたは検診画面では未生成ローディングにしない', () => {
  assert.equal(isMilestoneReportPending({
    isLoading: false,
    showCheckup: false,
    report,
  }), false);
  assert.equal(isMilestoneReportPending({
    isLoading: false,
    showCheckup: true,
    report: undefined,
  }), false);
});
