
create table public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 20),
  wpm numeric not null check (wpm >= 0 and wpm < 1000),
  accuracy numeric not null check (accuracy >= 0 and accuracy <= 100),
  mode text not null check (mode in ('learn','test')),
  content text not null check (content in ('letters','words','sentences','tongue_twisters','numbers')),
  input_scheme text not null check (input_scheme in ('paddle','two_key','literal')),
  duration_seconds integer not null check (duration_seconds > 0 and duration_seconds <= 600),
  created_at timestamptz not null default now()
);
alter table public.leaderboard_entries enable row level security;
create policy "public read leaderboard" on public.leaderboard_entries for select using (true);
create policy "public insert leaderboard" on public.leaderboard_entries for insert with check (true);
create index leaderboard_entries_filter_idx on public.leaderboard_entries (mode, content, wpm desc);
