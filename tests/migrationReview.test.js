const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(path, dependencies, globals = {}) {
  const exports = {};
  const source = fs.readFileSync(require.resolve(path), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected import: ${name}`);
      return dependencies[name];
    },
    ...globals,
  });
  return exports;
}

function historyHarness() {
  const store = new Map();
  const state = { user: { id: 'alice' }, rows: [], error: null, authError: null, inserted: [] };
  const query = {
    select() { return this; },
    eq(_key, id) { state.filter = id; return this; },
    order() { return this; },
    async limit() { return { data: state.rows, error: state.error }; },
    async insert(row) { state.inserted.push(row); return { error: state.error }; },
  };
  const api = loadModule('../data/history.js', {
    '@react-native-async-storage/async-storage': {
      async getItem(key) { return store.get(key) ?? null; },
      async setItem(key, value) { store.set(key, value); },
    },
    '../lib/supabase': { supabase: {
      auth: {
        async getSession() { return { data: { session: state.user ? {} : null }, error: state.authError }; },
        async getUser() { return { data: { user: state.user }, error: null }; },
      },
      from: () => query,
    } },
  });
  return { ...api, state, store };
}

test('signed-in results never appear in guest history after sign-out', async () => {
  const h = historyHarness();
  h.state.user = null;
  await h.saveResult({ declarationSummary: 'guest' });
  h.state.user = { id: 'alice' };
  await h.saveResult({ declarationSummary: 'private' });
  assert.equal(h.state.inserted[0].user_id, 'alice');
  assert.equal((await h.loadResults()).length, 0);
  assert.equal(h.state.filter, 'alice');
  h.state.user = null;
  const guest = await h.loadResults();
  assert.equal(guest.length, 1);
  assert.equal(guest[0].declarationSummary, 'guest');
});

test('cloud failures propagate and never fall back to shared local storage', async () => {
  const h = historyHarness();
  h.state.error = new Error('offline');
  await assert.rejects(h.loadResults(), /offline/);
  await assert.rejects(h.saveResult({ declarationSummary: 'private' }), /offline/);
  assert.equal(h.store.size, 0);
  h.state.error = null;
  h.state.rows = [{ ending_headline: 'restored' }];
  assert.equal((await h.loadResults())[0].endingTitle, 'restored');
});

test('auth lookup failures cannot save or load guest history', async () => {
  const h = historyHarness();
  h.state.authError = new Error('auth unavailable');
  await assert.rejects(h.loadResults(), /auth unavailable/);
  await assert.rejects(h.saveResult({}), /auth unavailable/);
  assert.equal(h.store.size, 0);
});

function apiHarness(statuses) {
  let calls = 0;
  const api = loadModule('../api/claudeClient.js', {
    '../lib/supabase': { supabase: { auth: {
      async getSession() { return { data: { session: { access_token: 'test' } } }; },
    } } },
  }, {
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test' } },
    AbortController,
    setTimeout(callback, delay) { if (delay < 15000) queueMicrotask(callback); return 1; },
    clearTimeout() {},
    async fetch() {
      const status = statuses[Math.min(calls++, statuses.length - 1)];
      return { status, ok: status === 200, async json() { return { text: 'ok' }; } };
    },
  });
  return { call: () => api.callClaudeApi({ messages: [] }), calls: () => calls };
}

for (const status of [429, 500, 503, 529]) {
  test(`AI retries temporary HTTP ${status} and recovers`, async () => {
    const h = apiHarness([status, 200]);
    assert.equal(await h.call(), 'ok');
    assert.equal(h.calls(), 2);
  });
}
for (const status of [400, 401, 403]) {
  test(`AI does not retry HTTP ${status}`, async () => {
    const h = apiHarness([status]);
    await assert.rejects(h.call(), new RegExp(String(status)));
    assert.equal(h.calls(), 1);
  });
}
test('AI stops after three attempts on persistent overload', async () => {
  const h = apiHarness([529]);
  await assert.rejects(h.call(), /529/);
  assert.equal(h.calls(), 3);
});

test('audio status preserves object identity while idle and updates on playback changes', () => {
  let status;
  let tick;
  const api = loadModule('../shims/expo-audio.ts', {
    react: {
      useState(initial) { status = initial; return [status, (update) => { status = update(status); }]; },
      useEffect(effect) { effect(); },
    },
  }, { window: { setInterval(callback) { tick = callback; return 1; }, clearInterval() {} } });
  const audio = { paused: true, ended: false, readyState: 1, duration: 20, currentTime: 0 };
  api.useAudioPlayerStatus({ audio });
  tick();
  const idle = status;
  tick();
  assert.equal(status, idle);
  audio.paused = false;
  audio.currentTime = 1;
  tick();
  assert.notEqual(status, idle);
  assert.equal(status.playing, true);
  assert.equal(status.currentTime, 1);
  audio.ended = true;
  tick();
  assert.equal(status.didJustFinish, true);
});
