// 時系列ニュース生成：節目ごとに表（ニュース）と裏（側近メモ）を生成する。
// Claude API（Haiku）に直接fetch。各節目で計5回呼ばれる。

import { FEW_SHOT_DECLARATION, FEW_SHOT_BEATS, TONE_PROMPTS } from '../data/prompts';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const TIMEOUT_MS = 20000;

// タイムアウト・エラー時のフォールバック
const FALLBACK = {
  news: '【速報】政府から新たな発表がありましたが、詳細は通信障害のため届いていません。続報をお待ちください。',
  memo: '側近メモ：通信が不安定で状況を把握できていない。とにかく独裁者の機嫌だけは損ねないように。',
};

function buildSystemPrompt(tone) {
  const example = FEW_SHOT_BEATS[0];
  const tonePrompt = Object.hasOwn(TONE_PROMPTS, tone) ? TONE_PROMPTS[tone] : TONE_PROMPTS.pop;
  return (
    'あなたは「欲望国家シム」のシナリオAIです。\n' +
    'プレイヤーは独裁者として欲望を法律として宣言しています。\n' +
    '指定された時点での国の状況を、表（ニュース報道）と裏（側近メモ）の二面で生成してください。\n' +
    '欲望メーターは各軸0〜100で、50が中立、0ほど弱く100ほど強い値です。\n' +
    '\n' +
    '【トーン指定：' + tonePrompt.label + '】\n' +
    tonePrompt.instruction + '\n' +
    '\n' +
    '出力は必ず以下の形式にしてください：\n' +
    '### NEWS\n（ニュース本文）\n### MEMO\n（側近メモ）\n' +
    '\n' +
    '例：\n' +
    '宣言：「' + FEW_SHOT_DECLARATION + '」\n' +
    '時点：' + example.milestone + '\n' +
    '回答：\n' +
    '### NEWS\n' + example.text + '\n' +
    '### MEMO\n' +
    '側近メモ：法務局が「究極」を辞書通りに取った。' +
    '現場は混乱しているが、誰も独裁者に逆らえない。' +
    'じゃんけん法だけで問い合わせが10万件。'
  );
}

/**
 * 指定された節目のニュースと側近メモを生成する。
 *
 * @param {Object} params
 * @param {string} params.declaration   - プレイヤーの宣言テキスト
 * @param {string} params.milestoneLabel - 節目ラベル（「初日」「1週間後」など）
 * @param {Object} params.meter         - 現在の欲望メーター { wealth: 20, power: 90, ... }
 * @param {string[]} params.previousDeclarations - これまでの追加宣言（検診で追加されたもの）
 * @param {string} params.tone          - トーンキー（pop / horror / real / emo）
 * @param {string} params.apiKey        - Claude APIキー
 * @returns {Promise<{news: string, memo: string}>}
 */
export async function generateBeat({
  declaration,
  milestoneLabel,
  meter,
  previousDeclarations = [],
  tone = 'pop',
  apiKey,
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const allDeclarations = [declaration, ...previousDeclarations];
  const meterSummary = Object.entries(meter)
    .map(([key, val]) => key + ':' + val)
    .join(' / ');

  const userMessage =
    '宣言：「' + allDeclarations.join('」「') + '」\n' +
    '時点：' + milestoneLabel + '\n' +
    '現在の欲望メーター：' + meterSummary;

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
        max_tokens: 1024,
        system: buildSystemPrompt(tone),
        messages: [{ role: 'user', content: userMessage }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn('generateBeat: API error', response.status);
      return { ...FALLBACK, isFallback: true };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    return parseBeat(text);
  } catch (err) {
    console.warn('generateBeat: fallback used', err.message);
    return { ...FALLBACK, isFallback: true };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * AIの出力テキストを ### NEWS / ### MEMO で分割する。
 */
function parseBeat(text) {
  const newsMarker = '### NEWS';
  const memoMarker = '### MEMO';

  const newsIdx = text.indexOf(newsMarker);
  const memoIdx = text.indexOf(memoMarker);

    if (newsIdx === -1 || memoIdx === -1 || memoIdx < newsIdx)  {
    // マーカーが見つからない場合、全文をニュースとして扱う
    return { news: text.trim() || FALLBACK.news, memo: FALLBACK.memo, isFallback: true };
  }

  const news = text
    .substring(newsIdx + newsMarker.length, memoIdx)
    .trim();
  const memo = text
    .substring(memoIdx + memoMarker.length)
    .trim();

  return {
    news: news || FALLBACK.news,
    memo: memo || FALLBACK.memo,
    isFallback: !news || !memo,
  };
}

export default generateBeat;
