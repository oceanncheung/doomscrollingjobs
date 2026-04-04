do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'packet_generation_status'
  ) then
    create type public.packet_generation_status as enum (
      'not_started',
      'running',
      'generated',
      'failed'
    );
  end if;
end
$$;

alter table public.resume_versions
  add column if not exists headline_text text,
  add column if not exists change_summary_text text;

alter table public.application_packets
  add column if not exists generation_status public.packet_generation_status not null default 'not_started',
  add column if not exists generation_provider text,
  add column if not exists generation_model text,
  add column if not exists generation_prompt_version text,
  add column if not exists generation_error text,
  add column if not exists job_summary text,
  add column if not exists job_focus_summary text,
  add column if not exists cover_letter_summary text;

update public.application_packets
set generation_status = case
  when generated_at is not null
    or coalesce(cover_letter_draft, '') <> ''
    or coalesce(professional_summary, '') <> ''
  then 'generated'::public.packet_generation_status
  else 'not_started'::public.packet_generation_status
end
where generation_status = 'not_started'::public.packet_generation_status;

create index if not exists application_packets_generation_status_idx
  on public.application_packets (generation_status);
