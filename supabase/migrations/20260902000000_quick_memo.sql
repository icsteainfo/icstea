-- ホーム画面ですぐメモできる自動保存の欄(常に1行のみ保持するシングルトン)

create table quick_memo (
  id text primary key default 'singleton',
  content text not null default '',
  updated_at timestamptz not null default now(),
  check (id = 'singleton')
);

insert into quick_memo (id, content) values ('singleton', '');

alter table quick_memo enable row level security;
create policy "authenticated_full_access" on quick_memo for all using (auth.role() = 'authenticated');

grant all on quick_memo to anon, authenticated, service_role;
