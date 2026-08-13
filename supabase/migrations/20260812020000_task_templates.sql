-- タスクテンプレート機能

create table if not exists task_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_task_templates_updated_at on task_templates;
create trigger trg_task_templates_updated_at before update on task_templates
  for each row execute function set_updated_at();

create table if not exists task_template_subtasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references task_templates(id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_task_template_subtasks_template
  on task_template_subtasks (template_id, sort_order);

alter table task_templates enable row level security;
alter table task_template_subtasks enable row level security;

drop policy if exists "authenticated_full_access" on task_templates;
create policy "authenticated_full_access" on task_templates for all using (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on task_template_subtasks;
create policy "authenticated_full_access" on task_template_subtasks for all using (auth.role() = 'authenticated');

grant all on task_templates to anon, authenticated, service_role;
grant all on task_template_subtasks to anon, authenticated, service_role;

-- 初期テンプレート2種類(新商品発売・新スタッフ入社)を投入。
-- カテゴリー「新商品」「人材」は、既にあれば新規作成せずそのまま使う。
with product_category as (
  select id from categories where name = '新商品' limit 1
),
staff_category as (
  select id from categories where name = '人材' limit 1
),
new_product_template as (
  insert into task_templates (name, category_id, sort_order)
  select '新商品発売', id, 0 from product_category
  where not exists (select 1 from task_templates where name = '新商品発売')
  returning id
),
new_staff_template as (
  insert into task_templates (name, category_id, sort_order)
  select '新スタッフ入社', id, 1 from staff_category
  where not exists (select 1 from task_templates where name = '新スタッフ入社')
  returning id
)
insert into task_template_subtasks (template_id, title, sort_order)
select id, title, ord - 1
from new_product_template,
  unnest(array[
    'レシピ確定',
    '原価計算',
    '販売価格決定',
    'POSに商品登録',
    'POP作成',
    'LINE準備',
    'Instagram投稿準備'
  ]) with ordinality as t(title, ord)
union all
select id, title, ord - 1
from new_staff_template,
  unnest(array[
    '雇用契約書',
    '必要な個人情報・書類の提出確認',
    'マニュアルを読む',
    '初回研修',
    'シフトボード登録',
    'レジにスタッフ名を追加'
  ]) with ordinality as t(title, ord);
