-- icsTEA 経営アシスタント Phase 1 — 初期スキーマ

create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 繰り返しタスクのルール(テンプレート)
create table task_recurrence_series (
  id uuid primary key default gen_random_uuid(),
  title_template text not null,
  category_id uuid references categories(id) on delete set null,
  assignee_type text not null default 'owner' check (assignee_type in ('owner','staff')),
  assignee_staff_id uuid references staff(id) on delete set null,
  memo_template text,
  recurrence_type text not null check (recurrence_type in ('daily','weekly','monthly_on_day','monthly_last_day')),
  recurrence_config jsonb,
  is_active boolean not null default true,
  last_generated_due_date date,
  created_at timestamptz not null default now(),
  check (assignee_type = 'owner' or assignee_staff_id is not null)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  memo text,
  category_id uuid references categories(id) on delete set null,
  assignee_type text not null default 'owner' check (assignee_type in ('owner','staff')),
  assignee_staff_id uuid references staff(id) on delete set null,
  due_date date,
  status text not null default 'open' check (status in ('open','completed')),
  completed_at timestamptz,
  is_waiting boolean not null default false,
  waiting_follow_up_date date,
  waiting_note text,
  priority_level text check (priority_level in ('urgent','high','medium','low')) default 'medium',
  priority_score int not null default 50,
  priority_reason text,
  priority_updated_at timestamptz,
  recurrence_series_id uuid references task_recurrence_series(id) on delete set null,
  source text not null default 'manual' check (source in ('manual','ai_chat')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (assignee_type = 'owner' or assignee_staff_id is not null)
);

create index idx_tasks_status_due on tasks (status, due_date);
create index idx_tasks_assignee on tasks (assignee_type, assignee_staff_id);
create index idx_tasks_waiting on tasks (is_waiting) where is_waiting;
create index idx_tasks_series on tasks (recurrence_series_id);
create index idx_tasks_category on tasks (category_id);

create table attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  kind text not null check (kind in ('file','url')),
  storage_path text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  external_url text,
  label text,
  created_at timestamptz not null default now()
);
create index idx_attachments_task on attachments (task_id);

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_tasks_updated_at before update on tasks
  for each row execute function set_updated_at();

-- RLS: オーナー1人のみのアプリなので「認証済み=オーナー本人」として扱う
alter table staff enable row level security;
alter table categories enable row level security;
alter table task_recurrence_series enable row level security;
alter table tasks enable row level security;
alter table attachments enable row level security;

create policy "authenticated_full_access" on staff for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on categories for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on task_recurrence_series for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on tasks for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on attachments for all using (auth.role() = 'authenticated');
