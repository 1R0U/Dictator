// Claude API共通クライアント：タイムアウト付きfetchラッパー。
// mapDesire / generateBeat / generateEnding の全AI呼び出しがこれを介して行われる。
// タイムアウトまたはHTTPエラー時は例外を投げるので、フォールバックは呼び出し側のtry/catchで処理する。

const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const TIMEOUT_MS = 15000;

/**
 * Claude APIにメッセージを送信し、応答テキストを返す。
 *
 * @param {Object} params
 * @param {string} params.apiKey   - Claude APIキー
 * @param {string} params.model    - モデルID
 * @param {string} params.system   - システムプロンプト
 * @param {Array<{role: string, content: string}>} params.messages - ユーザーメッセージ等
 * @param {number} params.maxTokens - 最大トークン数
 * @returns {Promise<string>} - 応答テキスト（content[0].text）
 * @throws {Error} タイムアウト・通信エラー・HTTPエラー時
 */
export async function callClaudeApi({ apiKey, model, system, messages, maxTokens }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Claude API error: ' + response.status);
    }

    const data = await response.json();
    return data.content?.[0]?.text ?? '';
  } finally {
    clearTimeout(timer);
  }
}

export default callClaudeApi;
