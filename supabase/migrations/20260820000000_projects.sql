-- プロジェクト管理機能
-- プロジェクト = 長期/中期の目的やまとまり、Todo(tasks) = それを進める具体的な作業

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'in_progress'
    check (status in ('in_progress','on_hold','completed')),
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_status on projects (status);

create trigger trg_projects_updated_at before update on projects
  for each row execute function set_updated_at();

-- Todoはプロジェクト未所属でもよい。プロジェクトが削除されてもTodo自体は残す。
alter table tasks add column project_id uuid references projects(id) on delete set null;
create index idx_tasks_project on tasks (project_id);

alter table projects enable row level security;
create policy "authenticated_full_access" on projects for all using (auth.role() = 'authenticated');

grant all on projects to anon, authenticated, service_role;
