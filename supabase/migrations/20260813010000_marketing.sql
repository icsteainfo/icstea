-- マーケティング施策記録機能

create table if not exists marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  type text not null check (
    type in (
      'instagram_post',
      'threads_post',
      'line_broadcast',
      'ad',
      'pop',
      'campaign',
      'collab',
      'new_product'
    )
  ),
  date date not null,
  menu_item_id uuid references menu_items(id) on delete set null,
  ad_cost numeric,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_marketing_campaigns_updated_at on marketing_campaigns;
create trigger trg_marketing_campaigns_updated_at before update on marketing_campaigns
  for each row execute function set_updated_at();

create index if not exists idx_marketing_campaigns_date on marketing_campaigns (date);
create index if not exists idx_marketing_campaigns_menu_item on marketing_campaigns (menu_item_id);

alter table marketing_campaigns enable row level security;

drop policy if exists "authenticated_full_access" on marketing_campaigns;
create policy "authenticated_full_access" on marketing_campaigns for all using (auth.role() = 'authenticated');

grant all on marketing_campaigns to anon, authenticated, service_role;
