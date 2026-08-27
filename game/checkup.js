const MAX_ADDITIONAL_DECLARATION_LENGTH = 300;

/**
 * 追加宣言として送信できる入力か判定する。
 *
 * @param {string} declaration 入力された追加宣言。
 * @returns {boolean} 空白以外の文字がある場合はtrue。
 */
function canSubmitAdditionalDeclaration(declaration) {
  const length = declaration.trim().length;
  return length > 0 && length <= MAX_ADDITIONAL_DECLARATION_LENGTH;
}

/**
 * 後続のAI結合へ渡せる追加宣言データを作成する。
 *
 * @param {string} milestoneKey 検診が発生した節目のキー。
 * @param {string} declaration 入力された追加宣言。
 * @returns {{ milestoneKey: string, declaration: string }} 正規化済みの追加宣言。
 */
function createAdditionalDeclaration(milestoneKey, declaration) {
  if (!milestoneKey || !canSubmitAdditionalDeclaration(declaration)) {
    throw new Error('A milestone key and additional declaration are required.');
  }

  return Object.freeze({
    milestoneKey,
    declaration: declaration.trim(),
  });
}

/**
 * 指定された節目で未処理の検診を表示するか判定する。
 *
 * @param {{ key: string, hasCheckup: boolean }} milestone 現在の節目。
 * @param {string[]} handledCheckups 処理済みの節目キー。
 * @returns {boolean} 検診を表示する場合はtrue。
 */
function shouldShowCheckup(milestone, handledCheckups) {
  return milestone.hasCheckup && !handledCheckups.includes(milestone.key);
}

/**
 * 節目を検診済みにし、重複のない新しい一覧を返す。
 *
 * @param {string[]} handledCheckups 処理済みの節目キー。
 * @param {string} milestoneKey 完了した節目キー。
 * @returns {string[]} 更新後の処理済み一覧。
 */
function completeCheckup(handledCheckups, milestoneKey) {
  return handledCheckups.includes(milestoneKey)
    ? handledCheckups
    : [...handledCheckups, milestoneKey];
}

/**
 * generateBeatへ渡す追加宣言本文を時系列順に取り出す。
 *
 * @param {{ declaration: string }[]} declarations これまでの追加宣言。
 * @returns {string[]} 追加宣言本文の一覧。
 */
function getPreviousDeclarationTexts(declarations) {
  return declarations.map((item) => item.declaration);
}

/**
 * 乱数値を配列内の安全なインデックスへ変換する。
 *
 * @param {number} itemCount 選択肢の数。
 * @param {number} [randomValue=Math.random()] 0以上1未満の乱数。
 * @returns {number} 選択されたインデックス。
 */
function selectRandomIndex(itemCount, randomValue = Math.random()) {
  if (!Number.isInteger(itemCount) || itemCount <= 0) {
    throw new RangeError('itemCount must be a positive integer.');
  }
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError('randomValue must be between 0 (inclusive) and 1 (exclusive).');
  }

  return Math.floor(randomValue * itemCount);
}

module.exports = {
  MAX_ADDITIONAL_DECLARATION_LENGTH,
  canSubmitAdditionalDeclaration,
  completeCheckup,
  createAdditionalDeclaration,
  getPreviousDeclarationTexts,
  selectRandomIndex,
  shouldShowCheckup,
};
