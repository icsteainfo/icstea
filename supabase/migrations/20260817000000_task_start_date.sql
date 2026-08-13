-- 単発Todoでも「開始日〜期限」の期間で登録できるようにする。
-- start_dateがnullなら従来通り単発の期限のみのTodoとして扱う(既存動作は変わらない)。
alter table tasks add column if not exists start_date date;
