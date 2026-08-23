-- 商品・原価管理 フェーズ5
-- 「原価計算の一覧に表示するか」を商品マスタ・在庫管理からの削除とは独立に管理するためのフラグと、
-- 重複商品を安全に統合(論理削除+統合先ポインタ)するための列を追加する。

alter table products add column show_in_costing boolean not null default true;
alter table products add column merged_into_product_id uuid references products(id) on delete set null;

create index idx_products_merged_into on products (merged_into_product_id);
