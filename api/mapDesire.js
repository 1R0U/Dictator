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
    '50を中立とし、5軸の合計が常に250前後になるように相対評価してください。\n' +
    'ある軸が上がれば、別の軸は下がります。すべてが同時に上がることはありません。\n' +
    '宣言に最も関係する軸を60〜80程度に上げ、関係の薄い軸や抑制される軸を20〜40程度に下げてバランスを取ってください。\n' +
    'domination（支配）：独裁的な内容なら加点、民主的・社会的な内容なら減点。\n' +
    'egoism（我欲）：自己利益を追求する内容なら加点、献身的・自己犠牲的な内容なら減点。\n' +
    'innovation（変革）：変化の度合いが大きいほど加点。過去の宣言と似た内容であれば加点を抑える。この軸は0始まり。\n' +
    'prestige（威信）：攻撃的な内容なら加点、友好的な内容なら減点。\n' +
    'madness（狂気）：道徳的でない内容なら加点、慈悲・平和的な内容なら減点。\n' +
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
