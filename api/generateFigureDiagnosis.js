// 偉人診断の文面生成：選出済みの人物とプレイ結果の欲望軸から、
// 一言紹介と偏見的な一言コメントをAIに書かせる。
// 人物の選出自体はgame/figureMatch.jsが担い、ここでは文面のみ生成する。

import { callClaudeApi } from './claudeClient';
import { extractMarkedSections } from './markedSections';
import { getDesireBiasComment } from '../game/desireBias';
import { buildFallbackBlurb } from '../data/figures';

const MODEL = 'claude-haiku-4-5-20251001';
const INTRO_MARKER = '### INTRO';
const BIAS_MARKER = '### BIAS';

function buildSystemPrompt() {
  return (
    '欲望軸は-100〜100の双極尺度で、0が中立です。負と正は弱さと強さではなく、互いに異なる欲望の方向です。\n' +
    '支配は排除↔征服、我欲は享楽↔独占、変革は破壊↔改造、威信は畏怖↔崇拝、狂気は狂信↔混沌です。\n' +
    'あなたは「欲望国家シム」の偉人診断AIです。\n' +
    'システムが既に選出した歴史上の人物と、プレイヤーの最終欲望軸を受け取り、次の2つを生成してください。\n' +
    '1. INTRO：選出された人物とプレイヤーの欲望傾向を重ね合わせた一言紹介（40〜70文字程度）\n' +
    '2. BIAS：欲望軸のうち突出した軸・低い軸を踏まえた、皮肉めいた一言コメント（40〜70文字程度）\n' +
    '実在の人物の実像を断定せず、あくまで風刺エンタメの誇張表現としてください。\n' +
    '出力は必ず以下の形式にしてください：\n' +
    INTRO_MARKER + '\n（一言紹介）\n' +
    BIAS_MARKER + '\n（偏見的な一言コメント）'
  );
}

function buildUserMessage({ figure, desireAxes }) {
  const patternSummary = Object.entries(figure.pattern)
    .map(([key, value]) => key + ':' + value)
    .join(' / ');
  const axesSummary = Object.entries(desireAxes)
    .map(([key, value]) => key + ':' + value)
    .join(' / ');

  return (
    '選出された人物：' + figure.name + '（' + figure.epithet + '）\n' +
    '人物の欲望パターン：' + patternSummary + '\n' +
    'プレイヤーの最終欲望軸：' + axesSummary
  );
}

/** AIの出力テキストを ### INTRO / ### BIAS で分割する。形式不正時はnull。 */
function parseDiagnosis(text) {
  const sections = extractMarkedSections(text, [INTRO_MARKER, BIAS_MARKER]);
  if (!sections) return null;

  const [blurb, biasComment] = sections;
  if (!blurb || !biasComment) return null;

  return { blurb, biasComment };
}

/**
 * 選出済みの人物とプレイ結果の欲望軸から、一言紹介・偏見コメントの文面を生成する。
 *
 * @param {Object} params
 * @param {Object} params.figure      - game/figureMatchで選出済みの人物（data/figures.jsの要素）
 * @param {Object} params.desireAxes  - プレイ結果の最終欲望軸
 * @param {string} params.apiKey      - Claude APIキー
 * @returns {Promise<{blurb: string, biasComment: string}>}
 */
export async function generateFigureDiagnosis({ figure, desireAxes, apiKey }) {
  const fallback = {
    blurb: buildFallbackBlurb(figure),
    biasComment: getDesireBiasComment(desireAxes),
  };

  try {
    const text = await callClaudeApi({
      apiKey,
      model: MODEL,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserMessage({ figure, desireAxes }) }],
      maxTokens: 512,
    });

    return parseDiagnosis(text) ?? fallback;
  } catch (err) {
    console.warn('generateFigureDiagnosis: fallback used', err.message);
    return fallback;
  }
}

export default generateFigureDiagnosis;
