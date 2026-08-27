// 欲望マッピング：宣言テキスト → 隠し欲望軸への配点JSON
// Claude API（Haiku）を共通クライアント経由で呼び出す。

import { AXES } from '../data/axes';
import { FEW_SHOT_DECLARATION, FEW_SHOT_MAPPING } from '../data/prompts';
import {
  DESIRE_NEUTRAL,
  clampDesireValue,
} from '../game/desireScale';
import { createFallbackMapping } from '../game/desireFallback';
import { callClaudeApi } from './claudeClient';

const MODEL = 'claude-haiku-4-5-20251001';

function buildSystemPrompt() {
  return (
    'あなたは「欲望国家シム」の欲望分析AIです。\n' +
    'プレイヤーの宣言テキストを読み、隠し欲望軸への配点をJSON形式で返してください。\n' +
    '軸は domination / egoism / innovation / prestige / madness の5つ。各軸0〜100の整数。\n' +
    '50を中立とし、欲望が弱いほど0、強いほど100に近づけてください。\n' +
    'domination（支配）：高=独裁・圧政、中=秩序・均衡、低=放任・混沌。\n' +
    'egoism（我欲）：高=貪欲・暴君、中=実利・合理、低=献身・犠牲。\n' +
    'innovation（変革）：高=創世・異端、中=保守・安定、低=停滞・固執。\n' +
    'prestige（威信）：高=畏怖・恐怖、中=威厳・尊敬、低=迎合・軽蔑。\n' +
    'madness（狂気）：高=破滅・狂信、中=偏執・妄信、低=理性・平穏。\n' +
    '5軸はそれぞれ独立に根拠を判断し、同じ数値を一律に割り当てないでください。\n' +
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
 * @returns {Promise<Object>}  - { domination: number, egoism: number, ... }
 */
export async function mapDesire(declaration, apiKey) {
  try {
    const text = await callClaudeApi({
      apiKey,
      model: MODEL,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: '宣言：「' + declaration + '」' }],
      maxTokens: 256,
    });
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
    return createFallbackMapping(declaration);
  }
}

export default mapDesire;
