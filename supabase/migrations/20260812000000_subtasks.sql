-- サブタスク(小項目ToDo)機能

alter table tasks add column progress_override int check (progress_override between 0 and 100);

create table subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  title text not null,
  status text not null default 'open' check (status in ('open','completed')),
  completed_at timestamptz,
  due_date date,
  assignee_type text not null default 'owner' check (assignee_type in ('owner','staff')),
  assignee_staff_id uuid references staff(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (assignee_type = 'owner' or assignee_staff_id is not null)
);

create index idx_subtasks_task on subtasks (task_id, sort_order);
create index idx_subtasks_due on subtasks (due_date) where status = 'open';

create trigger trg_subtasks_updated_at before update on subtasks
  for each row execute function set_updated_at();

alter table subtasks enable row level security;
create policy "authenticated_full_access" on subtasks for all using (auth.role() = 'authenticated');

grant all on subtasks to anon, authenticated, service_role;
