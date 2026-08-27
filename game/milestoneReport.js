const REPORT_SIDES = Object.freeze({
  NEWS: 'news',
  MEMO: 'memo',
});

/**
 * 選択中の面に対応する本文を返す。
 *
 * @param {string} side 表示する面。
 * @param {{ news: string, memo: string }} report NEWS/MEMO本文。
 * @returns {string} 選択中の面に表示する本文。
 */
function getReportContent(side, report) {
  return side === REPORT_SIDES.MEMO ? report.memo : report.news;
}

module.exports = { REPORT_SIDES, getReportContent };
