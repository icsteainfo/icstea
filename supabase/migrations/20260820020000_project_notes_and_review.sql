-- プロジェクトに「経過感想」(随時追加できる進捗メモ)と「最終評価」を追加

alter table projects add column final_review text;

create table project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_project_notes_project on project_notes (project_id, created_at);

alter table project_notes enable row level security;
create policy "authenticated_full_access" on project_notes for all using (auth.role() = 'authenticated');

grant all on project_notes to anon, authenticated, service_role;
