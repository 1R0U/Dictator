// Claude応答の "### MARKER\n本文" 形式を共通で解析するヘルパー。
// generateEnding / generateFigureDiagnosis の両方から利用する。

/**
 * テキストを複数のマーカーで区切り、各マーカー直後から次のマーカー直前までを
 * トリム済み文字列として順に返す。
 *
 * @param {string} text 解析対象のテキスト。
 * @param {string[]} markers 出現順に期待するマーカー一覧（例: ['### TITLE', '### BODY']）。
 * @returns {string[] | null} マーカー数と同じ長さの本文配列。マーカーが欠けている・順序が崩れている場合はnull。
 */
function extractMarkedSections(text, markers) {
  const indices = markers.map((marker) => text.indexOf(marker));
  if (indices.some((index) => index === -1)) return null;

  for (let i = 1; i < indices.length; i += 1) {
    if (!(indices[i - 1] < indices[i])) return null;
  }

  return markers.map((marker, i) => {
    const start = indices[i] + marker.length;
    const end = i + 1 < markers.length ? indices[i + 1] : text.length;
    return text.substring(start, end).trim();
  });
}

module.exports = { extractMarkedSections };
