// AI API共通クライアント：タイムアウト付きfetchラッパー。
// OpenAI API（ChatGPT）を使用。

const API_URL = 'https://api.openai.com/v1/chat/completions';
const TIMEOUT_MS = 15000;

export async function callClaudeApi({ apiKey, model, system, messages, maxTokens }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const openaiMessages = [
    { role: 'system', content: system },
    ...messages,
  ];

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: maxTokens,
        messages: openaiMessages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('OpenAI API error: ' + response.status);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  } finally {
    clearTimeout(timer);
  }
}

export default callClaudeApi;
