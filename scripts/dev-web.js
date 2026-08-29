const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const API_PORT = 8787;
const projectRoot = path.resolve(__dirname, '..');

/** .envをローカルプロキシだけで使う単純なキー値として読み込む。 */
function readEnvFile() {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')];
      }),
  );
}

/** Vercel用のAPIハンドラーをNodeのローカルHTTPサーバーに接続する。 */
function createApiServer(handler) {
  return http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    if (req.url !== '/api/generate') {
      res.writeHead(404).end();
      return;
    }

    let rawBody = '';
    req.on('data', (chunk) => { rawBody += chunk; });
    req.on('end', async () => {
      try {
        req.body = rawBody ? JSON.parse(rawBody) : {};
        res.status = (statusCode) => {
          res.statusCode = statusCode;
          return res;
        };
        res.json = (body) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        await handler(req, res);
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  });
}

const fileEnv = readEnvFile();
process.env.GEMINI_API_KEY ||= fileEnv.GEMINI_API_KEY || fileEnv.EXPO_PUBLIC_GEMINI_API_KEY;
if (!process.env.GEMINI_API_KEY) {
  console.error('.env に GEMINI_API_KEY を設定してください。');
  process.exit(1);
}

const handler = require('../api/generate');
const server = createApiServer(handler);
server.listen(API_PORT, '127.0.0.1', () => {
  console.log(`Local API proxy: http://127.0.0.1:${API_PORT}/api/generate`);
});

const childEnv = {
  ...process.env,
  EXPO_NO_DOTENV: '1',
  EXPO_PUBLIC_API_BASE_URL: `http://127.0.0.1:${API_PORT}/api/generate`,
  EXPO_PUBLIC_SUPABASE_URL: fileEnv.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: fileEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};
delete childEnv.EXPO_PUBLIC_GEMINI_API_KEY;
const expoCommand = process.platform === 'win32' ? process.env.ComSpec : 'npx';
const expoArgs = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'npx expo start --web']
  : ['expo', 'start', '--web'];
const expo = spawn(expoCommand, expoArgs, {
  cwd: projectRoot,
  env: childEnv,
  stdio: 'inherit',
});

/** Expoの終了に合わせてローカルAPIも停止する。 */
function shutdown(signal) {
  server.close();
  if (!expo.killed) expo.kill(signal);
}

expo.on('exit', (code) => {
  server.close(() => process.exit(code ?? 0));
});
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
