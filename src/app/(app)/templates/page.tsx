import { createClient } from "@/lib/supabase/server";
import { listTemplates } from "@/lib/templates/queries";
import { NameListManager } from "@/components/settings/name-list-manager";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const templates = await listTemplates(supabase);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">タスクテンプレート</h1>
        <p className="text-sm text-muted-foreground">
          よく使う手順をテンプレートとして登録しておくと、タスク作成時にサブタスクを自動生成できます。テンプレート名をタップすると、カテゴリーとサブタスクの中身を編集できます。
        </p>
      </div>
      <NameListManager
        apiBasePath="/api/templates"
        items={templates}
        addPlaceholder="新しいテンプレート名"
        deleteConfirmLabel="削除しても、このテンプレートから作成済みのタスクはそのまま残ります。"
        linkPrefix="/templates"
      />
    </div>
  );
}
