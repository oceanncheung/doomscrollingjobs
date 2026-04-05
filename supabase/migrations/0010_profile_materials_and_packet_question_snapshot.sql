do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'packet_question_snapshot_status'
  ) then
    create type public.packet_question_snapshot_status as enum (
      'not_started',
      'extracted',
      'none',
      'failed',
      'unsupported'
    );
  end if;
end
$$;

alter table public.resume_master
  add column if not exists base_cover_letter_text text;

alter table public.application_packets
  add column if not exists question_snapshot_status public.packet_question_snapshot_status not null default 'not_started',
  add column if not exists question_snapshot_error text,
  add column if not exists question_snapshot_refreshed_at timestamptz;

create index if not exists application_packets_question_snapshot_status_idx
  on public.application_packets (question_snapshot_status);
