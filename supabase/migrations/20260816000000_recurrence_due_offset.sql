-- 繰り返しTodo:「Todoが出現する日」と「期限」を分けられるようにする機能

-- 既存の繰り返しは due_offset_days=0(=出現日と同じ日が期限)として、動作を変えない
alter table task_recurrence_series add column if not exists due_offset_days int not null default 0;
alter table task_recurrence_series add column if not exists priority_level text
  check (priority_level in ('urgent', 'high', 'medium', 'low')) default 'medium';

create table if not exists task_recurrence_series_subtasks (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references task_recurrence_series(id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_task_recurrence_series_subtasks_series
  on task_recurrence_series_subtasks (series_id, sort_order);

alter table task_recurrence_series_subtasks enable row level security;

drop policy if exists "authenticated_full_access" on task_recurrence_series_subtasks;
create policy "authenticated_full_access" on task_recurrence_series_subtasks for all using (auth.role() = 'authenticated');

grant all on task_recurrence_series_subtasks to anon, authenticated, service_role;
