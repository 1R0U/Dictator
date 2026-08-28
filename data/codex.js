// 図鑑アーカイブ：解放済みの崩壊エンディング／偉人診断結果をAsyncStorageに保存する。
import AsyncStorage from '@react-native-async-storage/async-storage';

import { applyCodexUnlock, normalizeCodexState } from '../game/codexView';

const STORAGE_KEY = '@dictator/codex';

async function readState() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    return normalizeCodexState(JSON.parse(raw));
  } catch {
    return {};
  }
}

async function writeState(state) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function unlockEntry(category, key) {
  const state = await readState();
  const categoryState = state[category] ?? {};
  const nextEntry = applyCodexUnlock(categoryState[key] ?? null, new Date().toISOString());

  await writeState({
    ...state,
    [category]: { ...categoryState, [key]: nextEntry },
  });
  return nextEntry;
}

// 同時に呼ばれてもread-modify-writeが衝突しないよう、保存処理を直列化するキュー。
let saveQueue = Promise.resolve();

// category: 図鑑のカテゴリキー（例: 'collapse', 'figure'）。今後カテゴリが増えても新しい文字列を渡すだけでよい。
// key: そのカテゴリ内のエントリキー（崩壊ルートのendingType、偉人のfigure.keyなど）。
export function unlockCodexEntry(category, key) {
  const run = saveQueue.then(() => unlockEntry(category, key));
  saveQueue = run.catch(() => {});
  return run;
}

// 保存済みの図鑑状態を { [category]: { [key]: { timesSeen, firstSeenAt } } } の形で返す。
export async function loadCodexState() {
  await saveQueue;
  return readState();
}
