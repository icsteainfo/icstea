-- 月次経営MTG機能
-- 毎月、損益表の写真から項目・金額を読み取り、社長・経理とのMTGで話した内容を記録し、
-- その2つをもとにAIが次月以降の経営プランを提案する。

create table monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  month text not null unique check (month ~ '^\d{4}-\d{2}$'),
  pl_image_storage_path text,
  pl_image_file_name text,
  pl_line_items jsonb not null default '[]'::jsonb,
  meeting_notes text,
  ai_plan jsonb,
  ai_plan_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_monthly_reviews_month on monthly_reviews (month desc);

create trigger trg_monthly_reviews_updated_at before update on monthly_reviews
  for each row execute function set_updated_at();

alter table monthly_reviews enable row level security;
create policy "authenticated_full_access" on monthly_reviews for all using (auth.role() = 'authenticated');

grant all on monthly_reviews to anon, authenticated, service_role;

-- 損益表の写真を保存するストレージバケット(task-attachmentsと同様、非公開・署名付きURLで閲覧)
insert into storage.buckets (id, name, public)
values ('monthly-review-attachments', 'monthly-review-attachments', false)
on conflict (id) do nothing;

create policy "authenticated_full_access_monthly_review_attachments"
  on storage.objects for all
  using (bucket_id = 'monthly-review-attachments' and auth.role() = 'authenticated')
  with check (bucket_id = 'monthly-review-attachments' and auth.role() = 'authenticated');
