-- プロジェクトの「経過感想」「最終評価」に画像・PDF・URLを添付できるようにする。
-- note_idを指定すればその経過感想への添付、nullなら最終評価への添付として扱う。

create table project_attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  note_id uuid references project_notes(id) on delete cascade,
  kind text not null check (kind in ('file', 'url')),
  storage_path text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  external_url text,
  label text,
  created_at timestamptz not null default now()
);

create index idx_project_attachments_project on project_attachments (project_id);
create index idx_project_attachments_note on project_attachments (note_id);

alter table project_attachments enable row level security;
create policy "authenticated_full_access" on project_attachments for all using (auth.role() = 'authenticated');

grant all on project_attachments to anon, authenticated, service_role;

-- 添付ファイル(画像・PDFなど)を保存するストレージバケット(task-attachmentsと同様、非公開・署名付きURLで閲覧)
insert into storage.buckets (id, name, public)
values ('project-attachments', 'project-attachments', false)
on conflict (id) do nothing;

create policy "authenticated_full_access_project_attachments"
  on storage.objects for all
  using (bucket_id = 'project-attachments' and auth.role() = 'authenticated')
  with check (bucket_id = 'project-attachments' and auth.role() = 'authenticated');
