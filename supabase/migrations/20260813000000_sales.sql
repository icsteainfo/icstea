-- 売上分析機能

-- 販売チャネルごとの設定(手数料率など)
create table if not exists channel_settings (
  channel text primary key check (channel in ('airregi', 'uber_eats', 'rocket_now', 'stores')),
  display_name text not null,
  commission_rate numeric not null default 0 check (commission_rate >= 0 and commission_rate < 1)
);

insert into channel_settings (channel, display_name, commission_rate) values
  ('airregi', 'エアレジ(店頭)', 0),
  ('uber_eats', 'Uber Eats', 0.35),
  ('rocket_now', 'ロケットナウ', 0.35),
  ('stores', 'STORES(ネット販売)', 0)
on conflict (channel) do nothing;

-- 販売するメニュー商品(仕入れ管理用のproductsとは別。白桃アールグレイ等の完成品メニュー)
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_menu_items_updated_at on menu_items;
create trigger trg_menu_items_updated_at before update on menu_items
  for each row execute function set_updated_at();

-- 各チャネル上の商品名表記とmenu_itemsを対応付けるマッピング
create table if not exists channel_menu_item_mappings (
  id uuid primary key default gen_random_uuid(),
  channel text not null references channel_settings(channel),
  external_name text not null,
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (channel, external_name)
);

-- 日別・チャネル別の売上サマリー(ホーム・売上分析ページの主要な数字の元データ)
create table if not exists daily_channel_sales (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  channel text not null references channel_settings(channel),
  gross_amount numeric not null default 0,
  net_amount numeric not null default 0,
  order_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (date, channel)
);

drop trigger if exists trg_daily_channel_sales_updated_at on daily_channel_sales;
create trigger trg_daily_channel_sales_updated_at before update on daily_channel_sales
  for each row execute function set_updated_at();

create index if not exists idx_daily_channel_sales_date on daily_channel_sales (date);

-- 日別・チャネル別・商品別の販売数(商品別売上ページの元データ。取れないチャネルは空のまま)
create table if not exists menu_item_sales (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  channel text not null references channel_settings(channel),
  menu_item_id uuid references menu_items(id) on delete set null,
  external_name text not null,
  quantity numeric not null default 0,
  gross_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (date, channel, external_name)
);

create index if not exists idx_menu_item_sales_date on menu_item_sales (date);
create index if not exists idx_menu_item_sales_menu_item on menu_item_sales (menu_item_id);

-- 月間売上目標
create table if not exists sales_targets (
  id uuid primary key default gen_random_uuid(),
  month text not null unique check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  target_amount numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_sales_targets_updated_at on sales_targets;
create trigger trg_sales_targets_updated_at before update on sales_targets
  for each row execute function set_updated_at();

alter table channel_settings enable row level security;
alter table menu_items enable row level security;
alter table channel_menu_item_mappings enable row level security;
alter table daily_channel_sales enable row level security;
alter table menu_item_sales enable row level security;
alter table sales_targets enable row level security;

drop policy if exists "authenticated_full_access" on channel_settings;
create policy "authenticated_full_access" on channel_settings for all using (auth.role() = 'authenticated');
drop policy if exists "authenticated_full_access" on menu_items;
create policy "authenticated_full_access" on menu_items for all using (auth.role() = 'authenticated');
drop policy if exists "authenticated_full_access" on channel_menu_item_mappings;
create policy "authenticated_full_access" on channel_menu_item_mappings for all using (auth.role() = 'authenticated');
drop policy if exists "authenticated_full_access" on daily_channel_sales;
create policy "authenticated_full_access" on daily_channel_sales for all using (auth.role() = 'authenticated');
drop policy if exists "authenticated_full_access" on menu_item_sales;
create policy "authenticated_full_access" on menu_item_sales for all using (auth.role() = 'authenticated');
drop policy if exists "authenticated_full_access" on sales_targets;
create policy "authenticated_full_access" on sales_targets for all using (auth.role() = 'authenticated');

grant all on channel_settings to anon, authenticated, service_role;
grant all on menu_items to anon, authenticated, service_role;
grant all on channel_menu_item_mappings to anon, authenticated, service_role;
grant all on daily_channel_sales to anon, authenticated, service_role;
grant all on menu_item_sales to anon, authenticated, service_role;
grant all on sales_targets to anon, authenticated, service_role;
