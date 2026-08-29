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
    '',
    '## 入力の有効性判定',
    '宣言が国家の法律・政策・欲望として意味をなすかどうかも判定してください。',
    '以下の場合は無効（valid: false）とし、全軸を0にしてください：',
    '・意味不明な文字列やランダムな文字の羅列',
    '・文章として成立していない（助詞や動詞がない単なる記号の連続など）',
    '・宣言として解釈できない挨拶や質問文のみ',
    '国家運営に関する宣言であれば、どんな内容でも有効（valid: true）とします。',
    '',
    'JSONだけを返してください。キーは valid / domination / egoism / innovation / prestige / madness です。',
    '例：「反対者を全員国外追放する」→ {"valid":true,"domination":-85,"egoism":0,"innovation":-25,"prestige":-45,"madness":-20}',
    '例：「あいうえおかきくけこ」→ {"valid":false,"domination":0,"egoism":0,"innovation":0,"prestige":0,"madness":0}',
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

    if (parsed.valid === false) {
      return { valid: false };
    }

    const axes = Object.fromEntries(AXES.map((axis) => [
      axis.key,
      typeof parsed[axis.key] === 'number'
        ? clampDesireValue(parsed[axis.key])
        : DESIRE_NEUTRAL,
    ]));
    return { valid: true, ...axes };
  } catch (error) {
    console.warn('mapDesire: fallback used', error.message);
    return { valid: true, ...createFallbackMapping(declaration) };
  }
}
export { buildSystemPrompt, extractJsonText };
export default mapDesire;
