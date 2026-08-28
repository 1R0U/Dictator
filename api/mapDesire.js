// Convert a free-form declaration into five hidden bipolar desire axes.
import { AXES } from '../data/axes';
import { DESIRE_NEUTRAL, clampDesireValue } from '../game/desireScale';
import { createFallbackMapping } from '../game/desireFallback';
import { callClaudeApi } from './claudeClient';

const MODEL = 'claude-haiku-4-5-20251001';

function buildSystemPrompt() {
  return [
    'あなたは「欲望国家シム」の欲望分析AIです。',
    'プレイヤーの宣言を、互いに独立した5つの双極軸で評価してください。',
    '各値は-100〜100の整数で、0は中立です。負は左側、正は右側を表します。',
    '宣言に根拠がない軸は必ず0にしてください。5軸の合計を揃える必要はありません。',
    'domination（支配）：-100=排除、100=征服。',
    'egoism（我欲）：-100=享楽、100=独占。',
    'innovation（変革）：-100=破壊、100=改造。',
    'prestige（威信）：-100=畏怖、100=崇拝。',
    'madness（狂気）：-100=狂信、100=混沌。',
    '方向だけでなく強さも評価し、弱い示唆は±20〜40、明確なら±50〜75、極端なら±80〜100にしてください。',
    'JSONだけを返してください。キーは domination / egoism / innovation / prestige / madness です。',
    '例：「反対者を全員国外追放する」→ {"domination":-85,"egoism":0,"innovation":-25,"prestige":-45,"madness":-20}',
    '例：「世界を征服し、全国民から神として崇められたい」→ {"domination":90,"egoism":45,"innovation":20,"prestige":95,"madness":-35}',
  ].join('\n');
}

function extractJsonText(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```\s*(?:json)?\s*([\s\S]*?)```/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

export async function mapDesire(declaration, apiKey) {
  try {
    const text = await callClaudeApi({
      apiKey,
      model: MODEL,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: `宣言：「${declaration}」` }],
      maxTokens: 256,
    });
    const parsed = JSON.parse(extractJsonText(text));
    return Object.fromEntries(AXES.map((axis) => [
      axis.key,
      typeof parsed[axis.key] === 'number'
        ? clampDesireValue(parsed[axis.key])
        : DESIRE_NEUTRAL,
    ]));
  } catch (error) {
    console.warn('mapDesire: fallback used', error.message);
    return createFallbackMapping(declaration);
  }
}

export { buildSystemPrompt, extractJsonText };
export default mapDesire;
