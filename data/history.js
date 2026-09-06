// ログイン中はSupabase、未ログイン時は端末内に結果を保存する。
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

async function getHistoryUser() {
  if (!supabase) return null;
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) return null;
  const { data: { user }, error } = await supabase.auth.getUser(session.access_token);
  if (error) throw error;
  if (!user) throw new Error('Unable to verify history owner');
  return { id: user.id };
}

async function saveToSupabase(entry, user) {
  const { error } = await supabase.from('game_results').insert({
    user_id: user.id,
    declaration_summary: entry.declarationSummary ?? '',
    desire_axes: entry.desireAxes ?? {},
    ending_type: entry.endingType ?? '',
    ending_headline: entry.endingTitle ?? '',
    ending_body: entry.endingBody ?? '',
    additional_declarations: entry.additionalDeclarations ?? [],
  });
  if (error) throw error;
}

let saveQueue = Promise.resolve();

export function saveResult(result) {
  // Bind verification to the captured session before waiting for earlier saves.
  const historyUser = getHistoryUser();
  // Observe early failures while queued; the original promise still rejects below.
  historyUser.catch(() => {});
  const run = saveQueue.then(async () => {
    const user = await historyUser;
    if (!user) return appendLocalEntry(result);
    const entry = { ...result, savedAt: new Date().toISOString() };
    await saveToSupabase(entry, user);
    return entry;
  });
  saveQueue = run.catch(() => {});
  return run;
}

export async function loadResults() {
  await saveQueue;
  const user = await getHistoryUser();
  if (!user) {
    const entries = await readLocalEntries();
    return entries.reverse();
  }
  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(MAX_ENTRIES);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    declarationSummary: row.declaration_summary,
    desireAxes: row.desire_axes,
    endingType: row.ending_type,
    endingTitle: row.ending_headline,
    endingBody: row.ending_body,
    additionalDeclarations: row.additional_declarations,
    savedAt: row.created_at,
  }));
}
