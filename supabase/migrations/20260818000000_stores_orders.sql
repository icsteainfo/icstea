-- STORES注文とタスクを紐付けるための列
-- (同じ注文IDでのタスク重複作成を防ぎ、発送済み検知時にタスクを特定するために使う)
alter table tasks add column stores_order_id text unique;
create index idx_tasks_stores_order on tasks (stores_order_id);
