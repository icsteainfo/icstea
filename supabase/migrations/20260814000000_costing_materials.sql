-- 商品・原価管理 フェーズ1 — 原材料・資材マスタへの原価情報追加

alter table products add column supplier text;
alter table products add column purchase_price numeric;
alter table products add column package_amount numeric;
alter table products add column price_updated_at date;
alter table products add column note text;

-- 仕入価格・内容量の変更履歴(過去の単価を振り返れるようにするため)
create table raw_material_price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  purchase_price numeric not null,
  package_amount numeric not null,
  unit_cost numeric not null,
  changed_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_raw_material_price_history_product
  on raw_material_price_history (product_id, changed_at desc);

alter table raw_material_price_history enable row level security;
create policy "authenticated_full_access" on raw_material_price_history
  for all using (auth.role() = 'authenticated');

grant all on raw_material_price_history to anon, authenticated, service_role;
