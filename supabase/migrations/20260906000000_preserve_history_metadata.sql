-- Keep null for older rows: their scale cannot be inferred reliably.
alter table public.game_results
  add column if not exists desire_scale_version integer,
  add column if not exists figure_diagnosis jsonb;
