alter table public.user_profiles
  add column if not exists target_seniority_levels jsonb not null default '[]'::jsonb;

alter table public.job_scores
  add column if not exists ai_match_summary text,
  add column if not exists ai_description_excerpt text,
  add column if not exists ai_summary_status text not null default 'not_started',
  add column if not exists ai_summary_model text,
  add column if not exists ai_summary_generated_at timestamptz,
  add column if not exists ai_summary_error text;
