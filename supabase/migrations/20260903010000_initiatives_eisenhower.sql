-- 「今取り組んでいること」のステータスを、アイゼンハワー・マトリクスの4分類に変更する。
-- 進捗率ではなく「何を抱えていて、次に何をするか」を把握するための分類にするため、
-- 「やりたい/取り組み中/やらなければ」を廃止し、重要度×緊急度の4分類へ移行する。
-- 既存データは削除せず、以下のルールで新しい分類へ変換する:
--   must(やらなければ、期限ありのものが中心)         → urgent_important(今すぐ)
--   in_progress(取り組み中)                           → important_not_urgent(計画して進める)
--   want(やりたい、期限なしのものが中心)               → neither(あとで)

alter table initiatives drop constraint initiatives_status_check;

update initiatives set status = case status
  when 'must' then 'urgent_important'
  when 'in_progress' then 'important_not_urgent'
  when 'want' then 'neither'
  else status
end;

alter table initiatives add constraint initiatives_status_check
  check (status in ('urgent_important','important_not_urgent','urgent_not_important','neither'));
alter table initiatives alter column status set default 'important_not_urgent';
