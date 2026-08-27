const REPORT_SIDES = Object.freeze({
  NEWS: 'news',
  MEMO: 'memo',
});

const REPORT_STATUS = Object.freeze({
  LOADING: 'loading',
  FALLBACK: 'fallback',
  READY: 'ready',
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

/**
 * generateBeat呼び出しの状態から、節目共通コンポーネントが出す表示状態を決める。
 * ローディング中はフォールバック判定より優先する。
 *
 * @param {Object} params
 * @param {boolean} [params.isLoading] generateBeat呼び出し中かどうか。
 * @param {boolean} [params.isFallback] #11のタイムアウト・フォールバック機構がフォールバック本文を返したかどうか。
 * @returns {string} REPORT_STATUSのいずれか。
 */
function getReportStatus({ isLoading, isFallback } = {}) {
  if (isLoading) return REPORT_STATUS.LOADING;
  if (isFallback) return REPORT_STATUS.FALLBACK;
  return REPORT_STATUS.READY;
}

module.exports = { REPORT_SIDES, REPORT_STATUS, getReportContent, getReportStatus };
