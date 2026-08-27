// エンディング生成：決定論的に選ばれたエンディング型の文章をAIに書かせる。
// 型自体はアプリ側ロジックで決まるため、文章生成が失敗しても進行は止まらない。

import { FEW_SHOT_ENDING, TONE_PROMPTS } from '../data/prompts';
import { ENDING_CATALOG } from '../data/endingCatalog';
import { callClaudeApi } from './claudeClient';

const MODEL = 'claude-haiku-4-5-20251001';

// 後方互換の公開名。履歴再生と同じ共通カタログを参照する。
const ENDING_TEMPLATES = ENDING_CATALOG;

function buildSystemPrompt(tone) {
  const tonePrompt = Object.hasOwn(TONE_PROMPTS, tone) ? TONE_PROMPTS[tone] : TONE_PROMPTS.pop;
  return (
    'あなたは「欲望国家シム」のエンディング生成AIです。\n' +
    '指定されたエンディング型に合った結末の文章を生成してください。\n' +
    '欲望メーターは各軸0〜100で、50が中立、0ほど弱く100ほど強い値です。\n' +
    'domination=支配、egoism=我欲、innovation=変革、prestige=威信、madness=狂気です。\n' +
    '\n' +
    '【トーン指定：' + tonePrompt.label + '】\n' +
    tonePrompt.instruction + '\n' +
    '\n' +
    '出力は必ず以下の形式にしてください：\n' +
    '### TITLE\n（エンディングの見出し。『』で囲んだ短いフレーズ）\n' +
    '### BODY\n（結末の本文。3〜5文程度）\n' +
    '### STATS\n（最終ステータス。1行1項目、「・」始まり、5〜8個）\n' +
    '\n' +
    '例：\n' +
    'エンディング型：皮肉な平和\n' +
    '回答：\n' +
    '### TITLE\n『' + FEW_SHOT_ENDING.title + '』\n' +
    '### BODY\n' + FEW_SHOT_ENDING.body + '\n' +
    '### STATS\n' + FEW_SHOT_ENDING.stats.map((s) => '・' + s).join('\n')
  );
}

/**
 * エンディング型から見出し・本文・ステータスを生成する。
 *
 * @param {Object} params
 * @param {string} params.endingType       - エンディング型のキー（greed / emptiness / ruin / ironic_peace / chaos）
 * @param {Object} params.meter            - 最終の欲望メーター
 * @param {string} params.declaration      - 最初の宣言テキスト
 * @param {string} params.tone             - トーンキー（pop / horror / real / emo）
 * @param {string} params.apiKey           - Claude APIキー
 * @returns {Promise<{title: string, body: string, stats: string[]}>}
 */
export async function generateEnding({ endingType, meter, declaration, tone = 'pop', apiKey }) {
  const template = ENDING_TEMPLATES[endingType] ?? ENDING_TEMPLATES.chaos;

  const meterSummary = Object.entries(meter)
    .map(([key, val]) => key + ':' + val)
    .join(' / ');

  const userMessage =
    'エンディング型：' + endingType + '\n' +
    '最初の宣言：「' + declaration + '」\n' +
    '最終メーター：' + meterSummary;

  try {
    const text = await callClaudeApi({
      apiKey,
      model: MODEL,
      system: buildSystemPrompt(tone),
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 1024,
    });

    return parseEnding(text, template);
  } catch (err) {
    console.warn('generateEnding: fallback used', err.message);
    return template;
  }
}

/**
 * AIの出力テキストを ### TITLE / ### BODY / ### STATS で分割する。
 */
function parseEnding(text, fallback) {
  const titleMarker = '### TITLE';
  const bodyMarker = '### BODY';
  const statsMarker = '### STATS';

  const titleIdx = text.indexOf(titleMarker);
  const bodyIdx = text.indexOf(bodyMarker);
  const statsIdx = text.indexOf(statsMarker);

  // マーカーが正しい順序で見つからない場合はフォールバック
  if (titleIdx === -1 || bodyIdx === -1 || statsIdx === -1) {
    return fallback;
  }
  if (!(titleIdx < bodyIdx && bodyIdx < statsIdx)) {
    return fallback;
  }

  const title = text
    .substring(titleIdx + titleMarker.length, bodyIdx)
    .trim()
    .replace(/^『|』$/g, '');
  const body = text
    .substring(bodyIdx + bodyMarker.length, statsIdx)
    .trim();
  const statsRaw = text
    .substring(statsIdx + statsMarker.length)
    .trim();
  const stats = statsRaw
    .split('\n')
    .map((line) => line.replace(/^・/, '').trim())
    .filter((line) => line.length > 0);

  return {
    title: title || fallback.title,
    body: body || fallback.body,
    stats: stats.length > 0 ? stats : fallback.stats,
  };
}

export { ENDING_TEMPLATES };
export default generateEnding;
