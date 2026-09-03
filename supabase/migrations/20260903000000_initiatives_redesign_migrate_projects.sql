-- 「今取り組んでいること」をプロジェクト機能の後継として再設計する。
-- 進捗率の管理ではなく、やりたいこと・取り組み中・やらなければいけないことを頭の外に出して
-- 一覧できることを目的にするため、ステータスと項目を作り直す。
-- initiativesはこの時点でまだ0件のため、安全に列を変更できる。

alter table initiatives drop column current_state;

alter table initiatives drop constraint initiatives_status_check;
alter table initiatives add constraint initiatives_status_check
  check (status in ('want','in_progress','must'));
alter table initiatives alter column status set default 'want';

alter table initiatives add column due_date date;
alter table initiatives add column archived boolean not null default false;
create index idx_initiatives_archived on initiatives (archived);

-- 既存プロジェクトを取り組みへ移行する(プロジェクト・経過メモ・添付ファイルは削除しない。
-- 今後の画面はinitiatives側だけを使うが、旧データはそのままDBに残す)。
-- 期限が設定されているものは「やらなければ」、なければ「やりたい」として移行し、
-- 保留・完了だったものはアーカイブ済みとして移行する。
-- タイトル以外の目的・メモ・期間・振り返りは、情報を失わないよう1つのメモ欄にまとめる。
do $$
declare
  proj record;
  new_id uuid;
  next_sort integer;
begin
  select coalesce(max(sort_order), -1) + 1 into next_sort from initiatives;

  for proj in select * from projects order by created_at loop
    insert into initiatives (title, status, memo, due_date, archived, sort_order)
    values (
      proj.name,
      case when proj.due_date is not null then 'must' else 'want' end,
      nullif(concat_ws(
        E'\n\n',
        case when proj.purpose is not null and proj.purpose <> ''
          then '【目的】' || E'\n' || proj.purpose end,
        case when proj.memo is not null and proj.memo <> ''
          then '【メモ】' || E'\n' || proj.memo end,
        case when proj.start_date is not null or proj.end_date is not null
          then '【旧プロジェクト期間】' || coalesce(proj.start_date::text, '未定')
            || ' 〜 ' || coalesce(proj.end_date::text, '未定') end,
        case when proj.final_review is not null and proj.final_review <> ''
          then '【振り返り】' || E'\n' || proj.final_review end
      ), ''),
      proj.due_date,
      proj.phase in ('on_hold', 'completed'),
      next_sort
    )
    returning id into new_id;

    next_sort := next_sort + 1;

    update tasks set initiative_id = new_id where project_id = proj.id;
  end loop;
end $$;
