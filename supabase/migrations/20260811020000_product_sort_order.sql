alter table products add column sort_order int not null default 0;
create index idx_products_sort_order on products (sort_order);
