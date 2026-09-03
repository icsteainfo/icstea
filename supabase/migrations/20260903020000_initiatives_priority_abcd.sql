-- 「今取り組んでいること」の分類を、重要度×緊急度のABCD分類(優先度)に変更する。
-- 列名もstatusからpriorityへ変更し、実態(優先度)に合わせる。既存データは削除せず、
-- 以下のルールで新しい分類へ変換する:
--   urgent_important(今すぐ)             → A(重要かつ緊急)
--   important_not_urgent(計画して進める)  → B(重要だが緊急ではない)
--   urgent_not_important(任せる・早く処理) → C(緊急だが重要度は低い)
--   neither(あとで)                       → D(重要でも緊急でもない)

alter table initiatives rename column status to priority;
alter table initiatives rename constraint initiatives_status_check to initiatives_priority_check;
alter index idx_initiatives_status rename to idx_initiatives_priority;

alter table initiatives drop constraint initiatives_priority_check;

update initiatives set priority = case priority
  when 'urgent_important' then 'A'
  when 'important_not_urgent' then 'B'
  when 'urgent_not_important' then 'C'
  when 'neither' then 'D'
  else priority
end;

alter table initiatives add constraint initiatives_priority_check
  check (priority in ('A','B','C','D'));
alter table initiatives alter column priority set default 'B';
