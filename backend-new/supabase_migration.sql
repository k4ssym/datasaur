-- Run this in Supabase Dashboard → SQL Editor (project: datasaur)
-- Creates table for per-user analysis history

create table if not exists public.analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  primary_diagnosis text not null default '',
  icd10_code text not null default '',
  confidence_score double precision,
  protocol_reference text,
  differential_diagnoses jsonb default '[]',
  raw_protocol_snippets jsonb,
  input_preview text not null default '',
  input_text text,
  created_at timestamptz not null default now()
);

create index if not exists analysis_history_user_id_idx on public.analysis_history(user_id);
create index if not exists analysis_history_created_at_idx on public.analysis_history(created_at desc);

alter table public.analysis_history enable row level security;

create policy "Users can read own history"
  on public.analysis_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own history"
  on public.analysis_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own history"
  on public.analysis_history for delete
  using (auth.uid() = user_id);

-- Service role (backend) can do everything; RLS still applies to anon key.
