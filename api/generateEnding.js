// エンディング生成：決定論的に選ばれたエンディング型の文章をAIに書かせる。
// 型自体はアプリ側ロジックで決まるため、文章生成が失敗しても進行は止まらない。

import { FEW_SHOT_ENDING, TONE_PROMPTS } from '../data/prompts';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const TIMEOUT_MS = 20000;

// エンディング型ごとの固定テンプレート（フォールバック兼用）
const ENDING_TEMPLATES = {
  greed: {
    title: '果てなき強欲の国',
    body: 'すべてを手に入れたはずの独裁者。しかし国庫は空になり、国民は去り、残ったのは金メッキの玉座だけだった。',
    stats: ['国庫残高：0', '国民の信頼：測定不能', '独裁者の満足度：まだ足りない'],
  },
  emptiness: {
    title: '何もかもが空っぽの国',
    body: '望んだものはすべて叶った。なのに独裁者の心は満たされない。国民は笑顔を見せるが、それも法律で義務化されたものだった。',
    stats: ['達成した欲望：全部', '幸福度：該当なし', '意味：見つかりませんでした'],
  },
  ruin: {
    title: '崩壊した楽園',
    body: '独裁者の欲望は国の限界を超えた。インフラは崩壊し、経済は破綻し、最後の閣僚は辞表をFAXで送ってきた。FAXも壊れていた。',
    stats: ['GDP：マイナス', '閣僚数：0', 'FAX：故障中'],
  },
  ironic_peace: {
    title: '皮肉な平和',
    body: '表面上は平和だが、誰もが本音を隠して暮らしている。独裁者だけが「うまくいっている」と信じている。',
    stats: ['表面上の秩序：完璧', '本音：非公開', '独裁者の認識：ずれている'],
  },
  chaos: {
    title: '愉快なる混沌',
    body: '法律は矛盾だらけ、役所は機能不全、しかし国民はなぜか楽しそうだ。独裁者が何を言っても誰も真面目に聞いていないからだ。',
    stats: ['法律の数：999', '矛盾する法律：998', '国民のストレス：意外と低い'],
  },
};

function buildSystemPrompt(tone) {
  const tonePrompt = Object.hasOwn(TONE_PROMPTS, tone) ? TONE_PROMPTS[tone] : TONE_PROMPTS.pop;
  return (
    'あなたは「欲望国家シム」のエンディング生成AIです。\n' +
    '指定されたエンディング型に合った結末の文章を生成してください。\n' +
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const meterSummary = Object.entries(meter)
    .map(([key, val]) => key + ':' + val)
    .join(' / ');

  const userMessage =
    'エンディング型：' + endingType + '\n' +
    '最初の宣言：「' + declaration + '」\n' +
    '最終メーター：' + meterSummary;

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
      console.warn('generateEnding: API error', response.status);
      return template;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    return parseEnding(text, template);
  } catch (err) {
    console.warn('generateEnding: fallback used', err.message);
    return template;
  } finally {
    clearTimeout(timer);
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