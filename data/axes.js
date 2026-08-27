// 隠し欲望軸の定義：マッピング・メーター加算・エンディング判定で共通参照する
export const AXES = [
  {
    key: 'wealth',
    name: '富',
    label: '💰 富',
    initialValue: 50,
  },
  {
    key: 'power',
    name: '権力',
    label: '👑 権力',
    initialValue: 50,
  },
  {
    key: 'fame',
    name: '名声',
    label: '📣 名声',
    initialValue: 50,
  },
  {
    key: 'love',
    name: '愛憎',
    label: '💔 愛憎',
    initialValue: 50,
  },
  {
    key: 'pleasure',
    name: '快楽',
    label: '🎭 快楽',
    initialValue: 50,
  },
];

// 初期メーター状態を生成するヘルパー（{ wealth: 50, power: 50, ... }）
export function createInitialMeter() {
  return Object.fromEntries(AXES.map((axis) => [axis.key, axis.initialValue]));
}

export default AXES;
