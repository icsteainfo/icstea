-- 商品・原価管理 フェーズ2 — 中間レシピ(自家製シロップ等)

create table intermediate_recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  yield_amount numeric not null,
  yield_unit text not null default 'g',
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_intermediate_recipes_updated_at before update on intermediate_recipes
  for each row execute function set_updated_at();

create table intermediate_recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  intermediate_recipe_id uuid not null references intermediate_recipes(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  amount numeric not null,
  unit text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_intermediate_recipe_ingredients_recipe
  on intermediate_recipe_ingredients (intermediate_recipe_id, sort_order);

alter table intermediate_recipes enable row level security;
alter table intermediate_recipe_ingredients enable row level security;

create policy "authenticated_full_access" on intermediate_recipes
  for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on intermediate_recipe_ingredients
  for all using (auth.role() = 'authenticated');

grant all on intermediate_recipes to anon, authenticated, service_role;
grant all on intermediate_recipe_ingredients to anon, authenticated, service_role;
