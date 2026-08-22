-- 経過感想に「関連図」(ノードを矢印でつなぐ図)を書けるようにする

alter table project_notes
  add column note_type text not null default 'text' check (note_type in ('text', 'diagram')),
  add column diagram jsonb,
  alter column content drop not null;
