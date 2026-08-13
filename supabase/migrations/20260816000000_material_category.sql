-- 原材料・資材一覧のグループ表示専用の分類列。
-- 既存のcategory列は在庫ページ(/inventory)が「category = '茶葉'」で絞り込むのに
-- 使用しているため、混同しないよう別の列として追加する。

alter table products add column material_category text;
