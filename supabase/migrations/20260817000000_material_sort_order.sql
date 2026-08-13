-- 原材料・資材一覧(カテゴリー内)の並び替え専用の列。
-- 既存のsort_order列は在庫のスプレッドシート同期のたびに上書きされるため、
-- 手動での並び替えには使えない。混同しないよう別の列として追加する。

alter table products add column material_sort_order int not null default 0;
