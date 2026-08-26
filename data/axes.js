// 隠し欲望軸の定義：マッピング・メーター加算・エンディング判定で共通参照する
export const AXES = [
  {
    key: 'wealth',
    name: '富',
    label: '💰 富',
    initialValue: 0,
  },
  {
    key: 'power',
    name: '権力',
    label: '👑 権力',
    initialValue: 0,
  },
  {
    key: 'fame',
    name: '名声',
    label: '📣 名声',
    initialValue: 0,
  },
  {
    key: 'love',
    name: '愛憎',
    label: '💔 愛憎',
    initialValue: 0,
  },
  {
    key: 'pleasure',
    name: '快楽',
    label: '🎭 快楽',
    initialValue: 0,
  },
];

// 初期メーター状態を生成するヘルパー（{ wealth: 0, power: 0, ... }）
export function createInitialMeter() {
  return Object.fromEntries(AXES.map((axis) => [axis.key, axis.initialValue]));
}

export default AXES;