-- 商品・原価管理 フェーズ4 — 商品レシピ一覧のカテゴリー(recipe_category)ごとの初期設定。
-- 「ロイヤルミルクティーはMサイズのみ」のように、カテゴリーが実際に販売する
-- サイズ×HOT/ICEの組み合わせだけを行として持ち、それぞれの初期価格・容器を保存する。

create table recipe_category_defaults (
  id uuid primary key default gen_random_uuid(),
  category text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_recipe_category_defaults_updated_at before update on recipe_category_defaults
  for each row execute function set_updated_at();

create table recipe_category_default_variants (
  id uuid primary key default gen_random_uuid(),
  category_default_id uuid not null references recipe_category_defaults(id) on delete cascade,
  hot_ice text check (hot_ice in ('HOT', 'ICE')),
  size text not null,
  list_price numeric,
  cup_product_id uuid references products(id) on delete set null,
  lid_product_id uuid references products(id) on delete set null,
  straw_product_id uuid references products(id) on delete set null,
  sleeve_product_id uuid references products(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (category_default_id, hot_ice, size)
);

create index idx_recipe_category_default_variants_category
  on recipe_category_default_variants (category_default_id, sort_order);

alter table recipe_category_defaults enable row level security;
alter table recipe_category_default_variants enable row level security;

create policy "authenticated_full_access" on recipe_category_defaults
  for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on recipe_category_default_variants
  for all using (auth.role() = 'authenticated');

grant all on recipe_category_defaults to anon, authenticated, service_role;
grant all on recipe_category_default_variants to anon, authenticated, service_role;
