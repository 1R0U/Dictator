const REPORT_SIDES = Object.freeze({
  NEWS: 'news',
  MEMO: 'memo',
});

const REPORT_STATUS = Object.freeze({
  LOADING: 'loading',
  FALLBACK: 'fallback',
  READY: 'ready',
});

const SPEECH_RATES = Object.freeze([1, 2]);
const SPEECH_MODE_OFF = null;

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

/**
 * 読み上げボタンを押すたびに「読み上げなし」→×1→×2→「読み上げなし」…と巡回させる。
 *
 * @param {number|null} currentMode 現在の読み上げ状態。SPEECH_MODE_OFF（読み上げなし）またはSPEECH_RATESのいずれか。
 * @returns {number|null} 次の読み上げ状態。SPEECH_RATESに無い値を渡した場合はSPEECH_MODE_OFFへ戻す。
 */
function getNextSpeechMode(currentMode) {
  if (currentMode === SPEECH_MODE_OFF) return SPEECH_RATES[0];
  const index = SPEECH_RATES.indexOf(currentMode);
  if (index === -1 || index === SPEECH_RATES.length - 1) return SPEECH_MODE_OFF;
  return SPEECH_RATES[index + 1];
}

/**
 * 検診ではない節目でレポートが未生成の場合、初回描画からローディング扱いにする。
 *
 * @param {Object} params
 * @param {boolean} params.isLoading 生成処理が開始済みか。
 * @param {boolean} params.showCheckup 追加宣言の検診を表示中か。
 * @param {Object} [params.report] 現在の節目で生成済みのレポート。
 * @returns {boolean} レポート画面をローディング表示にするか。
 */
function isMilestoneReportPending({ isLoading, showCheckup, report }) {
  return isLoading || (!showCheckup && !report);
}

module.exports = {
  REPORT_SIDES,
  REPORT_STATUS,
  SPEECH_RATES,
  SPEECH_MODE_OFF,
  getReportContent,
  getReportStatus,
  getNextSpeechMode,
  isMilestoneReportPending,
};
