// 欲望マッピング：宣言テキスト → 隠し欲望軸への配点JSON
// Claude API（Haiku）に直接fetchする。ネイティブ実行前提でCORSなし。

import { AXES } from '../data/axes';
import { FEW_SHOT_DECLARATION, FEW_SHOT_MAPPING } from '../data/prompts';
import {
  DESIRE_NEUTRAL,
  clampDesireValue,
} from '../game/desireScale';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20241022';
const TIMEOUT_MS = 15000;

// パース失敗時のフォールバック（中立より少し高い全軸60）
const FALLBACK_MAPPING = Object.fromEntries(
  AXES.map((axis) => [axis.key, 60])
);

function buildSystemPrompt() {
  return (
    'あなたは「欲望国家シム」の欲望分析AIです。\n' +
    'プレイヤーの宣言テキストを読み、隠し欲望軸への配点をJSON形式で返してください。\n' +
    '軸は wealth / power / fame / love / pleasure の5つ。各軸0〜100の整数。\n' +
    '50を中立とし、欲望が弱いほど0、強いほど100に近づけてください。\n' +
    'JSONのみを返し、それ以外のテキストは一切含めないでください。\n' +
    '\n' +
    '例：\n' +
    '宣言：「' + FEW_SHOT_DECLARATION + '」\n' +
    '回答：' + JSON.stringify(FEW_SHOT_MAPPING)
  );
}

// Claudeが指示に反してコードフェンスでJSONを囲んで返すことがあるため除去する
function extractJsonText(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```\s*(?:json)?\s*([\s\S]*?)```/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

/**
 * 宣言テキストを欲望軸の配点に変換する。
 *
 * @param {string} declaration - プレイヤーの宣言テキスト
 * @param {string} apiKey      - Claude APIキー
 * @returns {Promise<Object>}  - { wealth: number, power: number, ... }
 */
export async function mapDesire(declaration, apiKey) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 256,
        system: buildSystemPrompt(),
        messages: [
          { role: 'user', content: '宣言：「' + declaration + '」' },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn('mapDesire: API error', response.status);
      return FALLBACK_MAPPING;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    const parsed = JSON.parse(extractJsonText(text));

    // 各軸が存在し数値であることを確認
    const result = {};
    for (const axis of AXES) {
      const val = parsed[axis.key];
      result[axis.key] = typeof val === 'number'
        ? clampDesireValue(val)
        : DESIRE_NEUTRAL;
    }
    return result;
  } catch (err) {
    console.warn('mapDesire: fallback used', err.message);
    return FALLBACK_MAPPING;
  } finally {
    clearTimeout(timer);
  }
}

export default mapDesire;
