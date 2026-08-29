// AI API共通クライアント：サーバーレス関数経由でGemini APIを呼び出す。
// APIキーはサーバー側に保持し、クライアントには渡さない。

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const CONFIGURED_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const PUBLIC_GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const API_BASE_URL = CONFIGURED_API_BASE_URL || '/api/generate';
const DIRECT_MODEL = 'gemini-3.5-flash-lite';

/** ExpoのローカルWebサーバーはVercel Functionsを配信しないため、開発時だけ直接APIを使う。 */
function shouldUseDirectLocalApi() {
  if (CONFIGURED_API_BASE_URL || !PUBLIC_GEMINI_API_KEY || typeof window === 'undefined') {
    return false;
  }
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

async function callDirectGemini({ system, messages, maxTokens, responseSchema, signal }) {
  const generationConfig = { maxOutputTokens: maxTokens || 1024 };
  if (responseSchema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = responseSchema;
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${DIRECT_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': PUBLIC_GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: messages.map((message) => message.content).join('\n') }] }],
        generationConfig,
      }),
      signal,
    },
  );
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callClaudeApi({ apiKey, model, system, messages, maxTokens, responseSchema }) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      if (shouldUseDirectLocalApi()) {
        return await callDirectGemini({
          system,
          messages,
          maxTokens,
          responseSchema,
          signal: controller.signal,
        });
      }
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system, messages, maxTokens, responseSchema }),
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
