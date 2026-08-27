const test = require('node:test');
const assert = require('node:assert/strict');

const { STAGES } = require('../game/navigation');

test('タイトル画面の各導線に一意なstage indexが割り当てられている', () => {
  assert.equal(STAGES.TITLE, 0);
  assert.equal(STAGES.DECLARATION, 1);
  assert.equal(STAGES.HISTORY, 2);
  assert.equal(STAGES.DAY_GENERATION, 3);
  assert.equal(STAGES.ENDING, 4);
  assert.equal(new Set(Object.values(STAGES)).size, 5);
});
