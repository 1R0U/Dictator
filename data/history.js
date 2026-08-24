// 結果アーカイブ：プレイ結果をAsyncStorageに保存する
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@dictator/history';
const MAX_ENTRIES = 20;

async function readEntries() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function appendEntry(result) {
  const entries = await readEntries();
  const entry = { ...result, savedAt: new Date().toISOString() };

  entries.push(entry);
  while (entries.length > MAX_ENTRIES) {
    entries.shift();
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entry;
}

// 同時に呼ばれてもread-modify-writeが衝突しないよう、保存処理を直列化するキュー。
let saveQueue = Promise.resolve();

// result: { declarationSummary, desireAxes, endingType, endingTitle } を想定。
// 日時は保存時にsavedAtとして付与する。
export function saveResult(result) {
  const run = saveQueue.then(() => appendEntry(result));
  saveQueue = run.catch(() => {});
  return run;
}
