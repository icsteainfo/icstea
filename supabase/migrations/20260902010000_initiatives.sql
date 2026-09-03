-- 「今取り組んでいること」機能
-- 取り組み(initiatives) = Todoより上位の、今抱えている仕事・テーマ
-- 取り組み -> 関連Todo(tasks) -> (必要なら)サブタスク、という階層にする

create table initiatives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'active'
    check (status in ('active','waiting','on_hold','completed')),
  current_state text,
  next_action text,
  memo text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_initiatives_status on initiatives (status);
create index idx_initiatives_sort_order on initiatives (sort_order);

create trigger trg_initiatives_updated_at before update on initiatives
  for each row execute function set_updated_at();

-- Todoは取り組み未所属でもよい。取り組みが削除されてもTodo自体は残す(project_idと同じ扱い)。
alter table tasks add column initiative_id uuid references initiatives(id) on delete set null;
create index idx_tasks_initiative on tasks (initiative_id);

alter table initiatives enable row level security;
create policy "authenticated_full_access" on initiatives for all using (auth.role() = 'authenticated');

grant all on initiatives to anon, authenticated, service_role;
