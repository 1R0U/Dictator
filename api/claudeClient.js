// AI API共通クライアント：タイムアウト付きfetchラッパー。
// Google Gemini APIを使用。

const TIMEOUT_MS = 15000;

export async function callClaudeApi({ apiKey, model, system, messages, maxTokens }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=' + apiKey;

  const userText = messages.map((m) => m.content).join('\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: userText }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Gemini API error: ' + response.status);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  } finally {
    clearTimeout(timer);
  }
}

export default callClaudeApi;
