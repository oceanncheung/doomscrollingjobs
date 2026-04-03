create type public.preference_signal_kind as enum (
  'save',
  'skip',
  'prepare',
  'apply'
);

create table public.raw_job_imports (
  id uuid primary key default gen_random_uuid(),
  source_identity_key text not null unique,
  source_key text,
  source_name text not null,
  source_kind public.job_source_kind not null,
  source_job_id text,
  source_url text not null,
  application_url text,
  company_name_raw text not null,
  title_raw text not null,
  location_raw text,
  compensation_raw text,
  posted_at_raw text,
  description_text text not null default '',
  raw_metadata jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null,
  imported_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.job_feedback_signals (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  signal_kind public.preference_signal_kind not null,
  signal_weight numeric(5,2) not null,
  source_context text,
  signal_payload jsonb not null default '{}'::jsonb,
  signal_recorded_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (operator_id, job_id)
);

create index raw_job_imports_source_name_idx on public.raw_job_imports (source_name, captured_at desc);
create index raw_job_imports_source_job_id_idx on public.raw_job_imports (source_name, source_job_id);
create index job_feedback_signals_operator_weight_idx on public.job_feedback_signals (operator_id, signal_weight desc, signal_recorded_at desc);
create index job_feedback_signals_job_idx on public.job_feedback_signals (job_id);

create trigger raw_job_imports_set_updated_at
before update on public.raw_job_imports
for each row execute function public.set_updated_at();

create trigger job_feedback_signals_set_updated_at
before update on public.job_feedback_signals
for each row execute function public.set_updated_at();
