const UNKNOWN_ENDING_TITLE = '名称のない結末';
const UNKNOWN_SAVED_AT = '日時不明';
const UNKNOWN_DECLARATION = '記録に残されていない宣言';
const { normalizeDesireAxes } = require('./desireScale');
const { ENDING_CATALOG } = require('../data/endingCatalog');

/**
 * 履歴一覧に表示するエンディング見出しを返す。
 *
 * @param {{ endingTitle?: string }} result 保存済みプレイ結果。
 * @returns {string} 空にならない表示見出し。
 */
function getHistoryTitle(result) {
  return typeof result?.endingTitle === 'string' && result.endingTitle.trim()
    ? result.endingTitle.trim()
    : UNKNOWN_ENDING_TITLE;
}

/** Return safe, trimmed additional declarations from a persisted result. */
function getHistoryAdditionalDeclarations(result) {
  if (!Array.isArray(result?.additionalDeclarations)) return [];

  return result.additionalDeclarations
    .filter((item) => item !== null && typeof item === 'object' && !Array.isArray(item))
    .filter((item) => typeof item.declaration === 'string' && item.declaration.trim())
    .map((item) => ({
      milestoneKey: typeof item.milestoneKey === 'string' ? item.milestoneKey : '',
      declaration: item.declaration.trim(),
    }));
}

/** Build the persisted result shared by the ending screen and history views. */
function createHistoryResult({
  declarationSummary,
  additionalDeclarations,
  desireAxes,
  endingBody,
  endingType,
  endingTitle,
  figureDiagnosis,
}) {
  return {
    declarationSummary,
    additionalDeclarations: getHistoryAdditionalDeclarations({ additionalDeclarations }),
    desireAxes,
    endingBody,
    endingType,
    endingTitle,
    figureDiagnosis,
  };
}

/**
 * Normalize persisted data so the history screen can render safely.
 *
 * @param {unknown} results Value loaded from storage.
 * @returns {Object[]} Valid history records.
 */
function normalizeHistoryResults(results) {
  if (!Array.isArray(results)) return [];

  return results
    .filter(
      (result) =>
        result !== null &&
        typeof result === 'object' &&
        !Array.isArray(result),
    )
    .map((result) => ({
      ...result,
      savedAt: typeof result.savedAt === 'string' ? result.savedAt : '',
      endingTitle: typeof result.endingTitle === 'string' ? result.endingTitle : '',
      endingBody: typeof result.endingBody === 'string' ? result.endingBody : '',
      declarationSummary:
        typeof result.declarationSummary === 'string' ? result.declarationSummary : '',
      additionalDeclarations: getHistoryAdditionalDeclarations(result),
      desireAxes: normalizeDesireAxes(result.desireAxes, 0),
    }));
}

/** Build the ending text shown when replaying a saved history record. */
function getHistoryEndingBody(result) {
  if (typeof result?.endingBody === 'string' && result.endingBody.trim()) {
    return result.endingBody.trim();
  }

  const typeBody = ENDING_CATALOG[result?.endingType]?.body;
  if (typeBody) return typeBody;

  const declaration = getHistoryDeclarationSummary(result);
  return `「${declaration}」から始まった国の、記録された結末。`;
}

/** Return the saved opening declaration or a safe fallback. */
function getHistoryDeclarationSummary(result) {
  return typeof result?.declarationSummary === 'string'
    && result.declarationSummary.trim()
    ? result.declarationSummary.trim()
    : UNKNOWN_DECLARATION;
}

/** Build the complete screen-reader label for a history card. */
function getHistoryAccessibilityLabel(result, title, savedAt) {
  const declarations = [
    `冒頭宣言「${getHistoryDeclarationSummary(result)}」`,
    ...getHistoryAdditionalDeclarations(result).map(
      (item) => `追加宣言「${item.declaration}」`,
    ),
  ];

  return [title, savedAt, ...declarations].join('、');
}

/** Return a readable label for the saved ending type. */
function getHistoryEndingTypeLabel(result) {
  return ENDING_CATALOG[result?.endingType]?.label ?? '分類不明';
}

/**
 * ISO形式の保存日時を履歴一覧向けに整形する。
 *
 * @param {string} savedAt ISO形式の保存日時。
 * @param {string} [locale] 表示ロケール。
 * @param {string} [timeZone] 表示タイムゾーン。
 * @returns {string} 整形済み日時。無効な場合は「日時不明」。
 */
function formatHistoryDate(savedAt, locale = 'ja-JP', timeZone) {
  if (typeof savedAt !== 'string' || !savedAt.trim()) return UNKNOWN_SAVED_AT;

  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return UNKNOWN_SAVED_AT;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

module.exports = {
  UNKNOWN_ENDING_TITLE,
  UNKNOWN_DECLARATION,
  UNKNOWN_SAVED_AT,
  createHistoryResult,
  formatHistoryDate,
  getHistoryAccessibilityLabel,
  getHistoryAdditionalDeclarations,
  getHistoryDeclarationSummary,
  getHistoryEndingBody,
  getHistoryEndingTypeLabel,
  getHistoryTitle,
  normalizeHistoryResults,
};
