-- スプレッドシート上の色分け(セルの背景色)を、アプリの在庫(茶葉)画面でも再現するための列
alter table products add column if not exists display_color text;
