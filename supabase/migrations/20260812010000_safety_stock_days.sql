-- 安全在庫を「1日あたりの使用量 × 何日分」で自動計算できるようにするための日数設定
-- (使用量データがまだ十分でない商品では、既存のsafety_stock列を手動の代わり値として使う)

alter table products add column safety_stock_days int not null default 7 check (safety_stock_days between 0 and 365);
