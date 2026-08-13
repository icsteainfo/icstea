-- 在庫・発注管理 — 商品マスタ・在庫記録

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null default '茶葉',
  unit text not null default 'g',
  lead_time_days int not null default 14,
  safety_stock numeric not null default 0,
  last_ordered_at date,
  last_received_at date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

create table stock_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  recorded_on date not null,
  quantity numeric not null,
  kitchen_back numeric,
  under_chair numeric,
  office numeric,
  warehouse numeric,
  created_at timestamptz not null default now(),
  unique (product_id, recorded_on)
);

create index idx_stock_snapshots_product_date
  on stock_snapshots (product_id, recorded_on desc);

-- タスクと商品を紐付けるための列(「発注する」タスクから商品を辿れるように)
alter table tasks add column related_product_id uuid references products(id) on delete set null;
create index idx_tasks_related_product on tasks (related_product_id);

alter table products enable row level security;
alter table stock_snapshots enable row level security;

create policy "authenticated_full_access" on products for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on stock_snapshots for all using (auth.role() = 'authenticated');

grant all on products to anon, authenticated, service_role;
grant all on stock_snapshots to anon, authenticated, service_role;
