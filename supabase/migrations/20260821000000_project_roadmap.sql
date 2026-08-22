-- プロジェクト管理画面をロードマップ(ガントチャート)型に改修するための変更
-- ・カテゴリで案件をグルーピングできるようにする(既存categoriesテーブルを再利用)
-- ・進捗%を廃止し、フェーズ(構想〜完了)で管理する
-- ・目的(purpose)とメモ(memo)を分離し、実際の終了日(end_date)を追加する

insert into categories (name, sort_order) values
  ('仕入', 100), ('EC', 101), ('マーケティング', 102),
  ('店舗運営', 103), ('システム', 104), ('経営', 105), ('その他', 106)
on conflict (name) do update set is_active = true;

alter table projects add column category_id uuid references categories(id) on delete set null;
create index idx_projects_category on projects (category_id);

alter table projects rename column description to purpose;
alter table projects add column memo text;
alter table projects add column end_date date;

alter table projects rename column status to phase;
alter table projects drop constraint projects_status_check;
update projects set phase = 'active' where phase = 'in_progress';
alter table projects alter column phase set default 'concept';
alter table projects add constraint projects_phase_check
  check (phase in ('concept', 'researching', 'preparing', 'active', 'operating', 'on_hold', 'completed'));
