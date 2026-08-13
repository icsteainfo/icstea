import { createClient } from "@/lib/supabase/server";
import { listCategories } from "@/lib/tasks/queries";
import { NameListManager } from "@/components/settings/name-list-manager";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const categories = await listCategories(supabase);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">カテゴリー</h1>
      <NameListManager
        apiBasePath="/api/categories"
        items={categories}
        addPlaceholder="新しいカテゴリー名"
        deleteConfirmLabel="削除しても、このカテゴリーが設定済みのタスクはそのまま残ります。新規のタスクでは選択できなくなります。"
      />
    </div>
  );
}
