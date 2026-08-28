// 図鑑（崩壊エンディング／偉人診断）の解放状態を扱う純粋ロジック。
// data/codex.js（AsyncStorage入出力）と components/Codex.js（表示）の両方から使う。
const { COLLAPSE_VISUALS } = require('../data/collapseVisuals');
const { ENDING_CATALOG } = require('../data/endingCatalog');
const { FIGURES } = require('../data/figures');

/** Return a valid { timesSeen, firstSeenAt } entry, or null if malformed/empty. */
function normalizeCodexEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;

  const timesSeen = Number.isFinite(entry.timesSeen) ? Math.floor(entry.timesSeen) : 0;
  const firstSeenAt = typeof entry.firstSeenAt === 'string' ? entry.firstSeenAt.trim() : '';
  if (timesSeen <= 0 || !firstSeenAt) return null;

  return { timesSeen, firstSeenAt };
}

/** Return a category's entries (e.g. all collapse-route unlocks) with malformed entries dropped. */
function normalizeCodexCategory(category) {
  if (!category || typeof category !== 'object' || Array.isArray(category)) return {};

  const normalized = {};
  Object.keys(category).forEach((key) => {
    const entry = normalizeCodexEntry(category[key]);
    if (entry) normalized[key] = entry;
  });
  return normalized;
}

/**
 * 保存済み（または未検証の）図鑑状態を安全な形へ正規化する。
 * カテゴリ数・カテゴリ名はここで固定しない。将来カテゴリが増えても素通りする。
 */
function normalizeCodexState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  const normalized = {};
  Object.keys(raw).forEach((category) => {
    normalized[category] = normalizeCodexCategory(raw[category]);
  });
  return normalized;
}

/**
 * 1エントリを解放（または再遭遇）した結果を返す純粋関数。
 *
 * @param {{timesSeen: number, firstSeenAt: string}|null} currentEntry 現在の解放状態。未解放ならnull。
 * @param {string} [unlockedAt] 今回の遭遇日時（ISO文字列）。省略時は現在時刻。
 * @returns {{timesSeen: number, firstSeenAt: string}} 更新後のエントリ。
 */
function applyCodexUnlock(currentEntry, unlockedAt) {
  const timestamp = typeof unlockedAt === 'string' && unlockedAt.trim()
    ? unlockedAt
    : new Date().toISOString();

  if (!currentEntry) {
    return { timesSeen: 1, firstSeenAt: timestamp };
  }

  return { timesSeen: currentEntry.timesSeen + 1, firstSeenAt: currentEntry.firstSeenAt };
}

/**
 * 崩壊図鑑：COLLAPSE_VISUALSに登録された全ルートを番号順に並べ、解放状態を合成する。
 * ルートが増えてもCOLLAPSE_VISUALS側に追記するだけで自動的に反映される。
 */
function buildCollapseCodexEntries(codexState, {
  visuals = COLLAPSE_VISUALS,
  catalog = ENDING_CATALOG,
} = {}) {
  const categoryState = normalizeCodexCategory(codexState?.collapse);

  return Object.keys(visuals)
    .map((key) => ({ key, visual: visuals[key] }))
    .sort((a, b) => a.visual.number.localeCompare(b.visual.number))
    .map(({ key, visual }) => {
      const entry = categoryState[key] ?? null;
      return {
        key,
        number: visual.number,
        kicker: visual.kicker,
        image: visual.image,
        imageLabel: visual.imageLabel,
        aspectRatio: visual.aspectRatio,
        label: catalog[key]?.label ?? '',
        title: catalog[key]?.title ?? '',
        body: catalog[key]?.body ?? '',
        unlocked: Boolean(entry),
        timesSeen: entry?.timesSeen ?? 0,
        firstSeenAt: entry?.firstSeenAt ?? null,
      };
    });
}

/**
 * 偉人図鑑：FIGURESの登録順を通し番号として扱い、解放状態を合成する。
 * 人物が増えてもFIGURES側に追記するだけで自動的に反映される。
 */
function buildFigureCodexEntries(codexState, { figures = FIGURES } = {}) {
  const categoryState = normalizeCodexCategory(codexState?.figure);

  return figures.map((figure, index) => {
    const entry = categoryState[figure.key] ?? null;
    return {
      key: figure.key,
      number: String(index + 1).padStart(2, '0'),
      name: figure.name,
      epithet: figure.epithet,
      pattern: figure.pattern,
      unlocked: Boolean(entry),
      timesSeen: entry?.timesSeen ?? 0,
      firstSeenAt: entry?.firstSeenAt ?? null,
    };
  });
}

module.exports = {
  applyCodexUnlock,
  buildCollapseCodexEntries,
  buildFigureCodexEntries,
  normalizeCodexCategory,
  normalizeCodexState,
};
