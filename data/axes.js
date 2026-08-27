// 隠し欲望軸の定義：マッピング・メーター加算・エンディング判定で共通参照する
export const AXES = [
  {
    key: 'domination',
    name: '支配',
    englishName: 'Domination',
    label: '👑 支配',
    initialValue: 50,
  },
  {
    key: 'egoism',
    name: '我欲',
    englishName: 'Egoism',
    label: '💰 我欲',
    initialValue: 50,
  },
  {
    key: 'innovation',
    name: '変革',
    englishName: 'Innovation',
    label: '⚡ 変革',
    initialValue: 50,
  },
  {
    key: 'prestige',
    name: '威信',
    englishName: 'Prestige',
    label: '🏛 威信',
    initialValue: 50,
  },
  {
    key: 'madness',
    name: '狂気',
    englishName: 'Madness',
    label: '🌀 狂気',
    initialValue: 50,
  },
];

// 初期メーター状態を生成するヘルパー（全軸50）。
export function createInitialMeter() {
  return Object.fromEntries(AXES.map((axis) => [axis.key, axis.initialValue]));
}

export default AXES;
