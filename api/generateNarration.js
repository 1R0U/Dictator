import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { createWaveBytes, decodeBase64 } from '../game/wavAudio';

const TTS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const TTS_MODEL = 'gemini-3.1-flash-tts-preview';
const TTS_TIMEOUT_MS = 30000;

function findAudioContent(value) {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.data === 'string' && (value.type === 'audio'
    || String(value.mime_type ?? value.mimeType ?? '').startsWith('audio/'))) return value;
  if (value.output_audio && typeof value.output_audio.data === 'string') return value.output_audio;
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findAudioContent(item);
        if (found) return found;
      }
    } else if (child && typeof child === 'object') {
      const found = findAudioContent(child);
      if (found) return found;
    }
  }
  return null;
}

async function requestNarration({ apiKey, text, fetchImpl = fetch }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
  try {
    const response = await fetchImpl(TTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: [
          '\u6b21\u306e\u672c\u6587\u3060\u3051\u3092\u3001\u81ea\u7136\u3067\u843d\u3061\u7740\u3044\u305f\u65e5\u672c\u8a9e\u306e\u30cb\u30e5\u30fc\u30b9\u30ca\u30ec\u30fc\u30b7\u30e7\u30f3\u3068\u3057\u3066\u8aad\u3093\u3067\u304f\u3060\u3055\u3044\u3002',
          '\u904e\u5270\u306a\u6f14\u6280\u3092\u907f\u3051\u3001\u53e5\u70b9\u3067\u306f\u81ea\u7136\u306b\u9593\u3092\u7f6e\u3044\u3066\u304f\u3060\u3055\u3044\u3002',
          `\u672c\u6587\uff1a${text}`,
        ].join('\n'),
        response_format: { type: 'audio' },
        generation_config: { speech_config: [{ voice: 'Charon' }] },
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Gemini TTS error: ${response.status}`);
    const audio = findAudioContent(await response.json());
    if (!audio?.data) throw new Error('Gemini TTS returned no audio');
    return {
      base64Audio: audio.data,
      mimeType: String(audio.mime_type ?? audio.mimeType ?? 'audio/L16'),
      sampleRate: Number(audio.sample_rate ?? audio.sampleRate) || 24000,
    };
  } finally { clearTimeout(timer); }
}

function saveAudio(bytes) {
  if (Platform.OS === 'web') return URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
  const file = new File(Paths.cache, `ending-narration-${Date.now()}.wav`);
  file.create({ overwrite: true });
  file.write(bytes);
  return file.uri;
}

export async function generateNarration({ apiKey, text, fetchImpl }) {
  if (!apiKey) throw new Error('Gemini API key is missing');
  if (!text?.trim()) throw new Error('Narration text is empty');
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const audio = await requestNarration({ apiKey, text, fetchImpl });
      const bytes = audio.mimeType.toLowerCase().includes('wav')
        ? decodeBase64(audio.base64Audio)
        : createWaveBytes(audio.base64Audio, audio.sampleRate);
      return { uri: saveAudio(bytes), durationLimitSeconds: 30 };
    } catch (error) { lastError = error; }
  }
  throw lastError;
}

export { findAudioContent, requestNarration };
