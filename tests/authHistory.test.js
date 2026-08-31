const test = require('node:test');
const assert = require('node:assert/strict');

const { scheduleAuthHistoryReload } = require('../game/authHistory');

for (const event of ['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT']) {
  test(`${event}後に認証コールバック外で履歴を再読込する`, () => {
    let reloaded = false;
    const scheduled = [];
    scheduleAuthHistoryReload(event, () => { reloaded = true; }, (callback, delay) => {
      scheduled.push({ callback, delay });
      return 1;
    });
    assert.equal(reloaded, false);
    assert.equal(scheduled[0].delay, 0);
    scheduled[0].callback();
    assert.equal(reloaded, true);
  });
}
