-- Googleスプレッドシート「在庫_ネット確認」タブの◎/×判定と連携するTodo自動作成機能

create table if not exists inventory_check_results (
  id uuid primary key default gen_random_uuid(),
  checked_on date not null,
  product_id uuid not null references products(id) on delete cascade,
  product_name text not null,
  required_text text,
  current_text text,
  shortage numeric,
  task_id uuid references tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (checked_on, product_id)
);

create index if not exists idx_inventory_check_results_date
  on inventory_check_results (checked_on desc);
create index if not exists idx_inventory_check_results_product
  on inventory_check_results (product_id);

alter table inventory_check_results enable row level security;

drop policy if exists "authenticated_full_access" on inventory_check_results;
create policy "authenticated_full_access" on inventory_check_results for all using (auth.role() = 'authenticated');

grant all on inventory_check_results to anon, authenticated, service_role;
