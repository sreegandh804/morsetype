ALTER TABLE public.leaderboard_entries
  ADD COLUMN IF NOT EXISTS rank text,
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'send';

CREATE INDEX IF NOT EXISTS leaderboard_entries_direction_idx ON public.leaderboard_entries (direction);
CREATE INDEX IF NOT EXISTS leaderboard_entries_rank_idx ON public.leaderboard_entries (rank);