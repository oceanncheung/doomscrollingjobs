create table if not exists public.operators (
  id uuid primary key references public.users(id) on delete cascade,
  display_name text not null,
  email text not null unique,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.operators (
  id,
  display_name,
  email,
  slug,
  created_at,
  updated_at
)
select
  users.id,
  coalesce(nullif(users.display_name, ''), split_part(users.email, '@', 1)),
  users.email,
  coalesce(
    nullif(split_part(lower(users.email), '@', 1), ''),
    'operator-' || left(replace(users.id::text, '-', ''), 8)
  ),
  users.created_at,
  users.updated_at
from public.users
on conflict (id) do update
set
  display_name = excluded.display_name,
  email = excluded.email,
  slug = excluded.slug,
  updated_at = excluded.updated_at;

create trigger operators_set_updated_at
before update on public.operators
for each row execute function public.set_updated_at();

alter table public.user_profiles
  add column if not exists operator_id uuid;
update public.user_profiles
set operator_id = user_id
where operator_id is null;
alter table public.user_profiles
  alter column operator_id set not null;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_operator_id_fkey'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_operator_id_fkey
      foreign key (operator_id)
      references public.operators(id)
      on delete cascade;
  end if;
end
$$;
create unique index if not exists user_profiles_operator_id_key on public.user_profiles (operator_id);

alter table public.portfolio_items
  add column if not exists operator_id uuid;
update public.portfolio_items
set operator_id = user_id
where operator_id is null;
alter table public.portfolio_items
  alter column operator_id set not null;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'portfolio_items_operator_id_fkey'
  ) then
    alter table public.portfolio_items
      add constraint portfolio_items_operator_id_fkey
      foreign key (operator_id)
      references public.operators(id)
      on delete cascade;
  end if;
end
$$;
create index if not exists portfolio_items_operator_id_idx on public.portfolio_items (operator_id);

alter table public.resume_master
  add column if not exists operator_id uuid;
update public.resume_master
set operator_id = user_id
where operator_id is null;
alter table public.resume_master
  alter column operator_id set not null;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'resume_master_operator_id_fkey'
  ) then
    alter table public.resume_master
      add constraint resume_master_operator_id_fkey
      foreign key (operator_id)
      references public.operators(id)
      on delete cascade;
  end if;
end
$$;
create unique index if not exists resume_master_operator_id_key on public.resume_master (operator_id);

alter table public.job_scores
  add column if not exists operator_id uuid;
update public.job_scores
set operator_id = user_id
where operator_id is null;
alter table public.job_scores
  alter column operator_id set not null;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'job_scores_operator_id_fkey'
  ) then
    alter table public.job_scores
      add constraint job_scores_operator_id_fkey
      foreign key (operator_id)
      references public.operators(id)
      on delete cascade;
  end if;
end
$$;
create index if not exists job_scores_operator_rank_idx
on public.job_scores (operator_id, workflow_status, total_score desc);
create unique index if not exists job_scores_operator_job_key
on public.job_scores (operator_id, job_id);

alter table public.resume_versions
  add column if not exists operator_id uuid;
update public.resume_versions
set operator_id = user_id
where operator_id is null;
alter table public.resume_versions
  alter column operator_id set not null;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'resume_versions_operator_id_fkey'
  ) then
    alter table public.resume_versions
      add constraint resume_versions_operator_id_fkey
      foreign key (operator_id)
      references public.operators(id)
      on delete cascade;
  end if;
end
$$;
create index if not exists resume_versions_operator_id_idx on public.resume_versions (operator_id);

alter table public.application_packets
  add column if not exists operator_id uuid;
update public.application_packets
set operator_id = user_id
where operator_id is null;
alter table public.application_packets
  alter column operator_id set not null;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'application_packets_operator_id_fkey'
  ) then
    alter table public.application_packets
      add constraint application_packets_operator_id_fkey
      foreign key (operator_id)
      references public.operators(id)
      on delete cascade;
  end if;
end
$$;
create index if not exists application_packets_operator_id_idx on public.application_packets (operator_id);

alter table public.application_answers
  add column if not exists operator_id uuid;
update public.application_answers
set operator_id = user_id
where operator_id is null;
alter table public.application_answers
  alter column operator_id set not null;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'application_answers_operator_id_fkey'
  ) then
    alter table public.application_answers
      add constraint application_answers_operator_id_fkey
      foreign key (operator_id)
      references public.operators(id)
      on delete cascade;
  end if;
end
$$;
create index if not exists application_answers_operator_id_idx on public.application_answers (operator_id);

alter table public.application_events
  add column if not exists operator_id uuid;
update public.application_events
set operator_id = user_id
where operator_id is null;
alter table public.application_events
  alter column operator_id set not null;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'application_events_operator_id_fkey'
  ) then
    alter table public.application_events
      add constraint application_events_operator_id_fkey
      foreign key (operator_id)
      references public.operators(id)
      on delete cascade;
  end if;
end
$$;
create index if not exists application_events_operator_id_event_at_idx
on public.application_events (operator_id, event_at desc);

alter table public.saved_searches
  add column if not exists operator_id uuid;
update public.saved_searches
set operator_id = user_id
where operator_id is null;
alter table public.saved_searches
  alter column operator_id set not null;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'saved_searches_operator_id_fkey'
  ) then
    alter table public.saved_searches
      add constraint saved_searches_operator_id_fkey
      foreign key (operator_id)
      references public.operators(id)
      on delete cascade;
  end if;
end
$$;
create index if not exists saved_searches_operator_id_idx on public.saved_searches (operator_id);

alter table public.company_watchlist
  add column if not exists operator_id uuid;
update public.company_watchlist
set operator_id = user_id
where operator_id is null;
alter table public.company_watchlist
  alter column operator_id set not null;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_watchlist_operator_id_fkey'
  ) then
    alter table public.company_watchlist
      add constraint company_watchlist_operator_id_fkey
      foreign key (operator_id)
      references public.operators(id)
      on delete cascade;
  end if;
end
$$;
alter table public.company_watchlist
  drop constraint if exists company_watchlist_source_key_key;
create index if not exists company_watchlist_operator_priority_idx
on public.company_watchlist (operator_id, priority asc);
create unique index if not exists company_watchlist_operator_source_key_key
on public.company_watchlist (operator_id, source_key);
