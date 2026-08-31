// AI API共通クライアント：サーバーレス関数経由でGemini APIを呼び出す。
// APIキーはサーバー側に保持し、クライアントには渡さない。

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const FUNCTION_NAME = process.env.NEXT_PUBLIC_AI_FUNCTION_NAME || 'generate';
const API_BASE_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`
  : null;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callClaudeApi({ apiKey, model, system, messages, maxTokens, responseSchema }) {
  if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase AI function is not configured');
  }
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const headers = { 'Content-Type': 'application/json' };
      headers.apikey = SUPABASE_ANON_KEY;
      headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, system, messages, maxTokens, responseSchema }),
        signal: controller.signal,
      });

      if (response.status === 503 && attempt < MAX_RETRIES - 1) {
        clearTimeout(timer);
        await wait(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        throw new Error('API error: ' + response.status);
      }

      const data = await response.json();
      return data.text ?? '';
    } catch (err) {
      clearTimeout(timer);
      if (attempt < MAX_RETRIES - 1 && err.name !== 'AbortError') {
        await wait(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

export default callClaudeApi;
