-- 商品レシピ一覧のグループ表示専用の分類列。
-- 既存のcategory列は売上分析(カテゴリー別売上)がPOS由来の部門名で使用しているため、
-- 混同しないよう別の列として追加する。

alter table menu_items add column recipe_category text;
