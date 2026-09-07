const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(path, dependencies, globals = {}) {
  const exports = {};
  const source = fs.readFileSync(require.resolve(path), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: path.replace(/\.js$/, '.jsx'),
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
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
  function queryFor(accessToken) { return {
    select() { return this; },
    eq(_key, id) { state.filter = id; return this; },
    order() { return this; },
    async limit() {
      state.readToken = accessToken;
      return { data: accessToken === state.filter ? state.rows : [], error: state.error };
    },
    async insert(row) {
      if (!accessToken || accessToken !== row.user_id) {
        return { error: new Error('RLS: token does not match history owner') };
      }
      state.inserted.push(row);
      if (state.pendingInsert) await state.pendingInsert;
      return { error: state.error };
    },
  }; }
  const api = loadModule('../data/history.js', {
    '@react-native-async-storage/async-storage': {
      async getItem(key) { return store.get(key) ?? null; },
      async setItem(key, value) { store.set(key, value); },
    },
    '../lib/supabase': { createHistoryClient: (token) => ({ from: () => queryFor(token) }), supabase: {
      auth: {
        async getSession() {
          return { data: { session: state.user ? { access_token: state.user.id } : null }, error: state.authError };
        },
        async getUser(token) {
          if (state.pendingVerification) await state.pendingVerification;
          return { data: { user: token ? { id: token } : state.user }, error: null };
        },
      },
      from: () => queryFor(state.user?.id),
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

for (const nextUser of [null, { id: 'bob' }]) {
  test(`history lookup keeps its verified identity across ${nextUser ? 'account switch' : 'sign-out'}`, async () => {
    const h = historyHarness();
    let release;
    h.state.pendingVerification = new Promise((resolve) => { release = resolve; });
    h.state.rows = [{ ending_headline: 'alice result' }];
    const loading = h.loadResults();
    await new Promise(setImmediate);
    h.state.user = nextUser;
    release();
    const results = await loading;
    assert.equal(h.state.readToken, 'alice');
    assert.equal(results[0].endingTitle, 'alice result');
    assert.equal(h.store.size, 0);
  });
}

test('cloud round-trip preserves current desire values and figure diagnosis', async () => {
  const { createHistoryResult, normalizeHistoryResults } = require('../game/historyView');
  const h = historyHarness();
  const entry = createHistoryResult({
    desireAxes: { domination: 0, egoism: -25, innovation: 50, prestige: 100, madness: -100 },
    figureDiagnosis: { name: 'test figure', body: 'test diagnosis' },
  });
  await h.saveResult(entry);
  h.state.rows = h.state.inserted;
  const [loaded] = normalizeHistoryResults(await h.loadResults());
  assert.deepEqual(loaded.desireAxes, entry.desireAxes);
  assert.equal(loaded.desireScaleVersion, entry.desireScaleVersion);
  assert.deepEqual(loaded.figureDiagnosis, entry.figureDiagnosis);
});

test('legacy cloud rows still use legacy scale conversion', async () => {
  const { normalizeHistoryResults } = require('../game/historyView');
  const h = historyHarness();
  h.state.rows = [{ desire_axes: { domination: 50 }, desire_scale_version: null }];
  const [loaded] = normalizeHistoryResults(await h.loadResults());
  assert.equal(loaded.desireAxes.domination, 0);
});

test('auth lookup failures cannot save or load guest history', async () => {
  const h = historyHarness();
  h.state.authError = new Error('auth unavailable');
  await assert.rejects(h.loadResults(), /auth unavailable/);
  await assert.rejects(h.saveResult({}), /auth unavailable/);
  assert.equal(h.store.size, 0);
});

test('queued saves keep their original owner across sign-out and sign-in', async () => {
  const h = historyHarness();
  let releaseInsert;
  h.state.pendingInsert = new Promise((resolve) => { releaseInsert = resolve; });
  const first = h.saveResult({ declarationSummary: 'first' });
  await new Promise(setImmediate);
  assert.equal(h.state.inserted.length, 1);

  let releaseVerification;
  h.state.pendingVerification = new Promise((resolve) => { releaseVerification = resolve; });
  const alice = h.saveResult({ declarationSummary: 'alice queued' });
  h.state.user = null;
  const guest = h.saveResult({ declarationSummary: 'guest queued' });
  h.state.user = { id: 'bob' };
  const bob = h.saveResult({ declarationSummary: 'bob queued' });
  await new Promise(setImmediate);
  assert.equal(h.state.inserted.length, 1);
  releaseVerification();
  releaseInsert();
  await Promise.all([first, alice, guest, bob]);
  assert.deepEqual(h.state.inserted.map((row) => [row.user_id, row.declaration_summary]), [
    ['alice', 'first'], ['alice', 'alice queued'], ['bob', 'bob queued'],
  ]);
  h.state.user = null;
  const local = await h.loadResults();
  assert.equal(local.length, 1);
  assert.equal(local[0].declarationSummary, 'guest queued');
});

test('queued signed-in save stays private when the user remains signed out', async () => {
  const h = historyHarness();
  let release;
  h.state.pendingInsert = new Promise((resolve) => { release = resolve; });
  const first = h.saveResult({});
  await new Promise(setImmediate);
  const queued = h.saveResult({ declarationSummary: 'private' });
  h.state.user = null;
  release();
  await Promise.all([first, queued]);
  assert.equal(h.state.inserted[1].user_id, 'alice');
  assert.equal(h.store.size, 0);
});

test('owner lookup failure while queued rejects without leaking or blocking later saves', async () => {
  const h = historyHarness();
  let release;
  h.state.pendingInsert = new Promise((resolve) => { release = resolve; });
  const first = h.saveResult({});
  await new Promise(setImmediate);
  h.state.authError = new Error('auth unavailable');
  const failed = h.saveResult({ declarationSummary: 'must not save' });
  const rejection = assert.rejects(failed, /auth unavailable/);
  await new Promise(setImmediate);
  h.state.authError = null;
  const next = h.saveResult({ declarationSummary: 'next' });
  release();
  await Promise.all([first, rejection, next]);
  assert.equal(h.state.inserted.length, 2);
  assert.equal(h.state.inserted[1].declaration_summary, 'next');
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

test('audio hook recreates its media element after effect cleanup and remount', async () => {
  let effect;
  const instances = [];
  const api = loadModule('../shims/expo-audio.ts', {
    react: { useMemo: (factory) => factory(), useEffect: (callback) => { effect = callback; } },
  }, {
    Audio: class {
      constructor(uri) { this.uri = uri; this.paused = true; instances.push(this); }
      play() { this.paused = false; return Promise.resolve(); }
      pause() { this.paused = true; }
    },
  });
  const player = api.useAudioPlayer('narration.mp3');
  assert.equal(instances.length, 0, 'render should not allocate media resources');
  const cleanup = effect();
  await player.play();
  assert.equal(instances[0].paused, false);
  cleanup();
  assert.equal(instances[0].paused, true);
  const finalCleanup = effect();
  await player.play();
  assert.equal(instances.length, 2);
  assert.equal(instances[1].paused, false);
  finalCleanup();
});

for (const mode of ['automatic', 'manual']) {
test(`rejected ${mode} ending audio playback activates fallback`, async () => {
  const state = [];
  const effects = [];
  const buttons = [];
  const api = loadModule('../components/EndingNews.js', {
    react: {
      useState(value) { const index = state.push(value) - 1; return [value, (next) => { state[index] = next; }]; },
      useRef: (value) => ({ current: value }),
      useEffect: (effect) => effects.push(effect),
    },
    'react/jsx-runtime': {
      jsx: (_type, props) => { if (props.onPress) buttons.push(props.onPress); return null; },
      jsxs: () => null,
    },
    'react-native': {
      Platform: { OS: 'web' }, StyleSheet: { create: (value) => value },
      useWindowDimensions: () => ({ width: 800, height: 800 }),
      Animated: { Value: class {} },
    },
    'expo-audio': {
      useAudioPlayer: () => ({ play: async () => { throw new Error('autoplay blocked'); } }),
      useAudioPlayerStatus: () => ({}),
      setAudioModeAsync: async () => {},
    },
    'expo-speech': {},
    '../game/endingNews': { getSceneAtTime: () => 0 },
  });
  api.default({ scenes: [{ narration: 'news', key: 'one' }], audioUri: 'news.mp3' });
  const cleanup = mode === 'automatic' ? effects[0]() : () => {};
  if (mode === 'manual') await buttons[0]();
  await new Promise(setImmediate);
  assert.equal(state[1], true);
  cleanup();
});
}

for (const playbackState of ['ready', 'error']) {
  test(`ending fallback cancels pending audio playback (${playbackState})`, () => {
    const effects = [];
    let stateIndex = 0;
    let pauses = 0;
    let cleared = false;
    const api = loadModule('../components/EndingNews.js', {
      react: {
        useState(value) { return [stateIndex++ === 1 ? playbackState === 'ready' : value, () => {}]; },
        useRef: (value) => ({ current: value }),
        useEffect: (effect) => effects.push(effect),
      },
      'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
      'react-native': {
        Platform: { OS: 'web' }, StyleSheet: { create: (value) => value },
        useWindowDimensions: () => ({ width: 800, height: 800 }),
        Animated: { Value: class {} },
      },
      'expo-audio': {
        useAudioPlayer: () => ({ pause: () => { pauses += 1; } }),
        useAudioPlayerStatus: () => ({ playbackState }),
      },
      'expo-speech': {},
      '../game/endingNews': { getSceneAtTime: () => 0 },
    }, {
      setInterval: () => 1,
      clearInterval: () => { cleared = true; },
    });
    api.default({ scenes: [{ narration: 'news', key: 'one' }], audioUri: 'news.mp3' });
    const cleanup = effects[2]();
    assert.equal(pauses, 1);
    cleanup();
    assert.equal(cleared, true);
  });
}

test('history request client sends its captured bearer token independently of other clients', async () => {
  const { createClient } = require('@supabase/supabase-js');
  const headers = [];
  const api = loadModule('../lib/supabase.js', {
    '@supabase/supabase-js': { createClient: (url, key, options) => createClient(url, key, {
      ...options,
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: async (_url, request) => {
        headers.push(new Headers(request.headers).get('Authorization'));
        return new Response(null, { status: 201 });
      } },
    }) },
  }, { process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test' } } });
  const alice = api.createHistoryClient('alice-token');
  const bob = api.createHistoryClient('bob-token');
  await bob.from('game_results').insert({ user_id: 'bob' });
  await alice.from('game_results').insert({ user_id: 'alice' });
  assert.deepEqual(headers, ['Bearer bob-token', 'Bearer alice-token']);
  assert.throws(() => api.createHistoryClient(''), /authentication is required/);
});

test('sound effects absorb asynchronous playback rejection', async () => {
  let calls = 0;
  const api = loadModule('../utils/sound.js', {
    'expo-audio': { createAudioPlayer: () => ({
      seekTo: async () => {},
      play: async () => { calls += 1; throw new Error('autoplay blocked'); },
    }) },
    '../data/soundEffects': { SOUND_EFFECTS: { click: 'click.mp3' } },
  });
  api.playSoundEffect('click');
  await new Promise(setImmediate);
  assert.equal(calls, 1);
});

function authPanelHarness(initial, signOut = async () => ({})) {
  const state = [];
  let cursor = 0;
  let effect;
  let callback;
  const api = loadModule('../components/web/AuthPanel.tsx', {
    react: {
      useState(value) {
        const index = cursor++;
        if (!(index in state)) state[index] = value;
        return [state[index], (next) => { state[index] = next; }];
      },
      useEffect: (next) => { effect = next; },
    },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    '../../lib/supabase': { isSupabaseConfigured: true, supabase: { auth: {
      getSession: () => initial,
      onAuthStateChange(next) { callback = next; return { data: { subscription: { unsubscribe() {} } } }; },
      signOut,
    } } },
  });
  const render = () => { cursor = 0; return api.AuthPanel(); };
  render();
  const cleanup = effect();
  return { state, render, cleanup, emit: (session) => callback('SIGNED_OUT', session) };
}

test('late initial auth lookup cannot restore the signed-out account', async () => {
  let resolve;
  const h = authPanelHarness(new Promise((done) => { resolve = done; }));
  h.emit(null);
  resolve({ data: { session: { user: { id: 'old-account' } } } });
  await new Promise(setImmediate);
  assert.equal(h.state[0], null);
  h.cleanup();
});

test('auth lookup completion after unmount does not update state', async () => {
  let resolve;
  const h = authPanelHarness(new Promise((done) => { resolve = done; }));
  h.cleanup();
  resolve({ data: { session: { user: { id: 'old-account' } } } });
  await new Promise(setImmediate);
  assert.equal(h.state[0], null);
});

test('initial auth lookup rejection is handled and displayed', async () => {
  const h = authPanelHarness(Promise.reject(new Error('offline')));
  await new Promise(setImmediate);
  assert.ok(h.state[2]);
  h.cleanup();
});

for (const throws of [false, true]) {
  test(`sign-out ${throws ? 'rejection' : 'error response'} keeps the account and displays an error`, async () => {
    const session = { user: { id: 'alice', email: 'alice@example.test' } };
    const h = authPanelHarness(Promise.resolve({ data: { session } }), async () => {
      if (throws) throw new Error('offline');
      return { error: new Error('offline') };
    });
    await new Promise(setImmediate);
    const button = h.render().props.children.find((child) => child?.type === 'button');
    await button.props.onClick();
    assert.equal(h.state[0], session);
    assert.ok(h.state[2]);
    assert.equal(h.state[3], false);
    const status = h.render().props.children.find((child) => child?.props?.role === 'status');
    assert.ok(status);
    h.cleanup();
  });
}

function edgeHarness(upstream = new Response(JSON.stringify({ content: [{ type: 'text', text: 'ok' }] })), authLookup = async () => ({ data: { user: { id: 'alice' } }, error: null })) {
  let handler;
  const requests = [];
  loadModule('../supabase/functions/generate/index.ts', {
    'npm:@supabase/supabase-js@2': { createClient: () => ({ auth: {
      getUser: authLookup,
    } }) },
  }, {
    Deno: { env: { get: (key) => key === 'ANTHROPIC_MODEL' ? undefined : 'test' }, serve: (next) => { handler = next; } },
    Response,
    fetch: async (_url, options) => { requests.push(JSON.parse(options.body)); return upstream; },
  });
  return { requests, call: (body) => handler(new Request('https://example.test/generate', {
    method: 'POST', headers: { Authorization: 'Bearer test' }, body,
  })) };
}

for (const body of ['{', 'null', '[]', '{"messages":[null]}',
  '{"messages":[{"role":"user","content":42}]}',
  '{"messages":[{"role":"user","content":"ok"}],"system":{}}',
  '{"messages":[{"role":"user","content":"ok"}],"maxTokens":1.5}',
  '{"messages":[{"role":"user","content":"ok"}],"maxTokens":"100"}',
]) {
  test(`invalid generation input returns 400: ${body}`, async () => {
    const h = edgeHarness();
    assert.equal((await h.call(body)).status, 400);
    assert.equal(h.requests.length, 0);
  });
}

test('generation still forwards valid input with bounded output tokens', async () => {
  const h = edgeHarness();
  const response = await h.call(JSON.stringify({ messages: [{ role: 'user', content: 'ok' }], maxTokens: 9000 }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).text, 'ok');
  assert.equal(h.requests[0].max_tokens, 4096);
});

test('non-JSON upstream errors preserve their HTTP status', async () => {
  const h = edgeHarness(new Response('overloaded', { status: 529 }));
  const response = await h.call(JSON.stringify({ messages: [{ role: 'user', content: 'ok' }] }));
  assert.equal(response.status, 529);
});

test('auth service rejection produces a retryable JSON response without calling Claude', async () => {
  const h = edgeHarness(undefined, async () => { throw new Error('connection failed'); });
  const response = await h.call('{"messages":[{"role":"user","content":"ok"}]}');
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'Authentication service unavailable');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(h.requests.length, 0);
});

test('invalid auth is still rejected before calling Claude', async () => {
  const h = edgeHarness(undefined, async () => ({ data: { user: null }, error: new Error('invalid token') }));
  const response = await h.call('{"messages":[{"role":"user","content":"ok"}]}');
  assert.equal(response.status, 401);
  assert.equal(h.requests.length, 0);
});

test('successful sign-out still updates the panel through its auth event', async () => {
  const h = authPanelHarness(Promise.resolve({ data: { session: { user: { id: 'alice' } } } }), async () => {
    h.emit(null);
    return { error: null };
  });
  await new Promise(setImmediate);
  const button = h.render().props.children.find((child) => child?.type === 'button');
  await button.props.onClick();
  assert.equal(h.state[0], null);
  assert.equal(h.state[2], '');
  assert.equal(h.state[3], false);
  h.cleanup();
});
