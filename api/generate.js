// Vercelサーバーレス関数：Gemini APIへのプロキシ

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { system, messages, maxTokens, responseSchema } = req.body;
  const userText = messages.map((m) => m.content).join('\n');
  const generationConfig = { maxOutputTokens: maxTokens || 1024 };
  if (responseSchema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = responseSchema;
  }

  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=' + apiKey;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: userText }] }],
        generationConfig,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Gemini API error: ' + response.status });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
