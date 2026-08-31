create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  declaration_summary text not null default '',
  desire_axes jsonb not null default '{}'::jsonb,
  ending_type text not null default '',
  ending_headline text not null default '',
  ending_body text not null default '',
  additional_declarations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Older deployments may already have game_results without account ownership.
alter table public.game_results
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists game_results_user_created_at_idx
  on public.game_results (user_id, created_at desc);

alter table public.game_results enable row level security;

create policy "Users can read their own results"
  on public.game_results for select
  using (auth.uid() = user_id);

create policy "Users can insert their own results"
  on public.game_results for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own results"
  on public.game_results for delete
  using (auth.uid() = user_id);
