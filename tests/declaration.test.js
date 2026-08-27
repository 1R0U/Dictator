const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TONES,
  canStartDeclaration,
  createGenerationInput,
} = require('../game/declaration');

test('宣言で選べるトーンは指定された4種類', () => {
  assert.deepEqual(TONES.map(({ label }) => label), ['ホラー', 'ポップ', 'リアル', 'エモ']);
});

test('宣言文と有効なトーンの両方が揃った場合だけ開始できる', () => {
  assert.equal(canStartDeclaration('すべての国民に休暇を与える', 'pop'), true);
  assert.equal(canStartDeclaration('   ', 'pop'), false);
  assert.equal(canStartDeclaration('すべての国民に休暇を与える', ''), false);
  assert.equal(canStartDeclaration('すべての国民に休暇を与える', 'unknown'), false);
});

test('後続の生成呼び出しに渡す入力を作成できる', () => {
  assert.deepEqual(
    createGenerationInput('  すべての国民に休暇を与える  ', 'emotional'),
    {
      declaration: 'すべての国民に休暇を与える',
      tone: 'emotional',
    },
  );
  assert.throws(() => createGenerationInput('宣言', 'unknown'));
});
