const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MAX_ADDITIONAL_DECLARATION_LENGTH,
  canSubmitAdditionalDeclaration,
  completeCheckup,
  createAdditionalDeclaration,
  getPreviousDeclarationTexts,
  shouldShowCheckup,
} = require('../game/checkup');

test('空白だけの追加宣言は送信できない', () => {
  assert.equal(canSubmitAdditionalDeclaration(''), false);
  assert.equal(canSubmitAdditionalDeclaration('   '), false);
  assert.equal(
    canSubmitAdditionalDeclaration('あ'.repeat(MAX_ADDITIONAL_DECLARATION_LENGTH + 1)),
    false,
  );
});

test('入力がある場合だけ追加宣言を送信できる', () => {
  assert.equal(canSubmitAdditionalDeclaration('休日を増やす'), true);
});

test('追加宣言を節目と紐づけて正規化する', () => {
  assert.deepEqual(createAdditionalDeclaration('month1', '  休日を増やす  '), {
    milestoneKey: 'month1',
    declaration: '休日を増やす',
  });
  assert.throws(() => createAdditionalDeclaration('month1', '   '));
});

test('3回の検診は処理後に再表示されない', () => {
  const checkupMilestones = [
    { key: 'month1', hasCheckup: true },
    { key: 'halfYear', hasCheckup: true },
    { key: 'year1', hasCheckup: true },
  ];
  let handled = [];

  for (const milestone of checkupMilestones) {
    assert.equal(shouldShowCheckup(milestone, handled), true);
    handled = completeCheckup(handled, milestone.key);
    assert.equal(shouldShowCheckup(milestone, handled), false);
  }

  assert.deepEqual(handled, ['month1', 'halfYear', 'year1']);
});

test('検診のない節目では吹き出しを表示しない', () => {
  assert.equal(shouldShowCheckup({ key: 'day1', hasCheckup: false }, []), false);
});

test('それまでの追加宣言を時系列順で生成処理へ渡す', () => {
  const declarations = [
    createAdditionalDeclaration('month1', '休日を増やす'),
    createAdditionalDeclaration('halfYear', '祝日には菓子を配る'),
  ];

  assert.deepEqual(getPreviousDeclarationTexts(declarations), [
    '休日を増やす',
    '祝日には菓子を配る',
  ]);
});
