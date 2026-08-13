-- 商品・原価管理 フェーズ3 — 商品レシピ(HOT/ICE・サイズ違いのバリエーションと原価計算)

-- menu_itemsを「商品グループ」と「バリエーション(実際に原価・価格を持つ単位)」の
-- 両方に使えるように拡張する。parent_menu_item_idがnullの行はグループの親、
-- 値が入っている行はそのバリエーション(例: ロイヤルミルクティー ICE M)を表す。
alter table menu_items add column parent_menu_item_id uuid references menu_items(id) on delete set null;
alter table menu_items add column hot_ice text check (hot_ice in ('HOT', 'ICE'));
alter table menu_items add column size text;
alter table menu_items add column variant_label text;
alter table menu_items add column list_price numeric;

create index idx_menu_items_parent on menu_items (parent_menu_item_id);

create table menu_item_ingredients (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  ingredient_type text not null check (ingredient_type in ('raw_material', 'intermediate_recipe')),
  product_id uuid references products(id) on delete restrict,
  intermediate_recipe_id uuid references intermediate_recipes(id) on delete restrict,
  amount numeric not null,
  unit text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (
    (ingredient_type = 'raw_material' and product_id is not null and intermediate_recipe_id is null)
    or
    (ingredient_type = 'intermediate_recipe' and intermediate_recipe_id is not null and product_id is null)
  )
);

create index idx_menu_item_ingredients_menu_item
  on menu_item_ingredients (menu_item_id, sort_order);

alter table menu_item_ingredients enable row level security;
create policy "authenticated_full_access" on menu_item_ingredients
  for all using (auth.role() = 'authenticated');

grant all on menu_item_ingredients to anon, authenticated, service_role;
