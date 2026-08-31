// 結果アーカイブ：Supabaseに保存し、AsyncStorageをオフラインフォールバックとして残す
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = '@dictator/history';
const MAX_ENTRIES = 20;

async function readLocalEntries() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function appendLocalEntry(result) {
  const entries = await readLocalEntries();
  const entry = { ...result, savedAt: new Date().toISOString() };
  entries.push(entry);
  while (entries.length > MAX_ENTRIES) {
    entries.shift();
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entry;
}

async function saveToSupabase(entry) {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('game_results').insert({
      user_id: user.id,
      declaration_summary: entry.declarationSummary ?? '',
      desire_axes: entry.desireAxes ?? {},
      ending_type: entry.endingType ?? '',
      ending_headline: entry.endingTitle ?? '',
      ending_body: entry.endingBody ?? '',
      additional_declarations: entry.additionalDeclarations ?? [],
    });
    if (error) {
      console.warn('Supabase save failed:', error.message);
    }
  } catch (err) {
    console.warn('Supabase save failed, kept local result:', err.message);
  }
}

let saveQueue = Promise.resolve();

export function saveResult(result) {
  const run = saveQueue.then(async () => {
    const entry = await appendLocalEntry(result);
    await saveToSupabase(entry);
    return entry;
  });
  saveQueue = run.catch(() => {});
  return run;
}

export async function loadResults() {
  await saveQueue;
  if (!supabase) {
    const entries = await readLocalEntries();
    return entries.reverse();
  }
  let isAuthenticated = false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const entries = await readLocalEntries();
      return entries.reverse();
    }
    isAuthenticated = true;
    const { data, error } = await supabase
      .from('game_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(MAX_ENTRIES);
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        declarationSummary: row.declaration_summary,
        desireAxes: row.desire_axes,
        endingType: row.ending_type,
        endingTitle: row.ending_headline,
        endingBody: row.ending_body,
        additionalDeclarations: row.additional_declarations,
        savedAt: row.created_at,
      }));
    }
  } catch (err) {
    console.warn('Supabase load failed:', err.message);
  }
  if (isAuthenticated) return [];
  const entries = await readLocalEntries();
  return entries.reverse();
}
