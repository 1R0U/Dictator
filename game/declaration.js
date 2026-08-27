const TONES = Object.freeze([
  Object.freeze({ id: 'horror', label: 'ホラー', description: '不穏でぞっとする' }),
  Object.freeze({ id: 'pop', label: 'ポップ', description: '明るく軽やか' }),
  Object.freeze({ id: 'real', label: 'リアル', description: '生々しく現実的' }),
  Object.freeze({ id: 'emotional', label: 'エモ', description: '切なく心に響く' }),
]);

const TONE_IDS = new Set(TONES.map(({ id }) => id));

/**
 * 宣言文とトーンがゲーム開始に使用できる組み合わせか判定する。
 *
 * @param {string} declaration プレイヤーが入力した宣言文。
 * @param {string} toneId 選択されたトーンID。
 * @returns {boolean} 宣言を開始できる場合はtrue。
 */
function canStartDeclaration(declaration, toneId) {
  return declaration.trim().length > 0 && TONE_IDS.has(toneId);
}

/**
 * 後続の生成処理へ渡す、正規化済みの入力を作成する。
 *
 * @param {string} declaration プレイヤーが入力した宣言文。
 * @param {string} toneId 選択されたトーンID。
 * @returns {{ declaration: string, tone: string }} 生成処理用の入力。
 * @throws {Error} 宣言文が空、またはトーンIDが無効な場合。
 */
function createGenerationInput(declaration, toneId) {
  if (!canStartDeclaration(declaration, toneId)) {
    throw new Error('A declaration and valid tone are required.');
  }

  return Object.freeze({
    declaration: declaration.trim(),
    tone: toneId,
  });
}

module.exports = { TONES, canStartDeclaration, createGenerationInput };
