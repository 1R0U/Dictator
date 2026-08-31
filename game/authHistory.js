const HISTORY_AUTH_EVENTS = new Set(['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT']);

/** Schedule history loading after Supabase finishes its auth callback. */
export function scheduleAuthHistoryReload(event, reload, schedule = setTimeout) {
  if (!HISTORY_AUTH_EVENTS.has(event)) return null;
  return schedule(reload, 0);
}
