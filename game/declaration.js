const TONES = Object.freeze([
  Object.freeze({ id: 'horror', label: 'ホラー', description: '不穏でぞっとする' }),
  Object.freeze({ id: 'pop', label: 'ポップ', description: '明るく軽やか' }),
  Object.freeze({ id: 'real', label: 'リアル', description: '生々しく現実的' }),
  Object.freeze({ id: 'emotional', label: 'エモ', description: '切なく心に響く' }),
]);

const TONE_IDS = new Set(TONES.map(({ id }) => id));

function canStartDeclaration(declaration, toneId) {
  return declaration.trim().length > 0 && TONE_IDS.has(toneId);
}

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
