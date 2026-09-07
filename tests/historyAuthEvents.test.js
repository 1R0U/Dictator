const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(require.resolve('../components/History.js'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  fileName: 'History.jsx',
}).outputText;

function mountHistory(loadHistory) {
  const state = [];
  const effects = [];
  const requestId = { current: 0 };
  let onAuth;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    setTimeout,
    clearTimeout,
    require(name) {
      if (name === 'react') return {
        useState(initial) {
          const index = state.push(initial) - 1;
          return [initial, (value) => { state[index] = value; }];
        },
        useRef: () => requestId,
        useCallback: (callback) => callback,
        useEffect: (effect) => effects.push(effect),
      };
      if (name === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null };
      if (name === 'react-native') return { StyleSheet: { create: (styles) => styles } };
      if (name === './ScreenContainer') return { useResponsiveLayout: () => ({}) };
      if (name === '../lib/supabase') return {
        supabase: { auth: { onAuthStateChange(callback) {
          onAuth = callback;
          return { data: { subscription: { unsubscribe() {} } } };
        } } },
      };
      if (name === '../game/authHistory') return require('../game/authHistory');
      if (name === '../game/historyView') return require('../game/historyView');
      return {};
    },
  });
  exports.default({ loadHistory });
  const cleanups = effects.map((effect) => effect());
  return { state, requestId, emit: (event) => onAuth(event), cleanup: () => cleanups.forEach((fn) => fn?.()) };
}

for (const event of ['INITIAL_SESSION', 'TOKEN_REFRESHED', 'USER_UPDATED', 'PASSWORD_RECOVERY']) {
  test(`${event} preserves displayed history, page and an in-flight request`, async () => {
    let resolve;
    const view = mountHistory(() => new Promise((done) => { resolve = done; }));
    try {
      const displayed = [{ id: 'existing' }];
      view.state[0] = displayed;
      view.state[3] = 2;
      const requestId = view.requestId.current;
      view.emit(event);
      assert.equal(view.state[0], displayed);
      assert.equal(view.state[3], 2);
      assert.equal(view.requestId.current, requestId);
      resolve([{ id: 'loaded', savedAt: '2026-09-06T00:00:00Z' }]);
      await new Promise(setImmediate);
      assert.equal(view.state[0][0].id, 'loaded');
      assert.equal(view.state[1], false);
    } finally {
      view.cleanup();
    }
  });
}

for (const event of ['SIGNED_IN', 'SIGNED_OUT']) {
  test(`${event} clears old history immediately and reloads outside the auth callback`, async () => {
    let calls = 0;
    const view = mountHistory(async () => { calls += 1; return []; });
    try {
      await Promise.resolve();
      view.state[0] = [{ id: 'previous-user' }];
      view.state[3] = 2;
      const requestId = view.requestId.current;
      view.emit(event);
      assert.equal(view.state[0].length, 0);
      assert.equal(view.state[3], 0);
      assert.equal(view.requestId.current, requestId + 1);
      assert.equal(calls, 1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.equal(calls, 2);
      assert.equal(view.state[1], false);
    } finally {
      view.cleanup();
    }
  });
}

test('INITIAL_SESSION does not duplicate the initial history load', async () => {
  let calls = 0;
  const view = mountHistory(async () => { calls += 1; return []; });
  try {
    view.emit('INITIAL_SESSION');
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(calls, 1);
  } finally {
    view.cleanup();
  }
});

for (const event of ['SIGNED_IN', 'SIGNED_OUT']) {
  test(`${event} discards the previous account's late history response`, async () => {
    let resolvePrevious;
    let calls = 0;
    const view = mountHistory(() => {
      calls += 1;
      return calls === 1
        ? new Promise((resolve) => { resolvePrevious = resolve; })
        : Promise.resolve([{ id: 'current-account' }]);
    });
    try {
      view.emit(event);
      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.equal(view.state[0][0].id, 'current-account');
      resolvePrevious([{ id: 'previous-account' }]);
      await new Promise(setImmediate);
      assert.equal(view.state[0][0].id, 'current-account');
      assert.equal(view.state[1], false);
    } finally {
      view.cleanup();
    }
  });
}

test('a failed history request sets the error state instead of showing empty history', async () => {
  const view = mountHistory(async () => { throw new Error('offline'); });
  try {
    await new Promise(setImmediate);
    assert.equal(view.state[1], false);
    assert.ok(view.state[2]);
  } finally {
    view.cleanup();
  }
});
