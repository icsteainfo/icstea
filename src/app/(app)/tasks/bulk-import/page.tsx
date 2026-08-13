import { createClient } from "@/lib/supabase/server";
import { listCategories, listStaff } from "@/lib/tasks/queries";
import { listTemplates, listTemplateSubtasks } from "@/lib/templates/queries";
import { BulkImportFlow } from "@/components/tasks/bulk-import-flow";

export default async function BulkImportPage() {
  const supabase = await createClient();
  const [categories, staff, templates] = await Promise.all([
    listCategories(supabase),
    listStaff(supabase),
    listTemplates(supabase),
  ]);

  const templatesWithSubtasks = await Promise.all(
    templates.map(async (template) => {
      const subtasks = await listTemplateSubtasks(supabase, template.id);
      return {
        id: template.id,
        name: template.name,
        categoryId: template.category_id,
        subtaskTitles: subtasks.map((subtask) => subtask.title),
      };
    }),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Todoをまとめて取り込む</h1>
      <p className="text-sm text-muted-foreground">
        ChatGPTなどでまとめたTodoの文章を貼り付ける、またはGoogle
        ToDo・メモアプリ・LINEなどのスクリーンショットをアップロードすると、AIが内容を読み取ってタスクの登録候補を作成します。内容を確認・修正してから登録できます。
      </p>
      <BulkImportFlow
        categories={categories}
        staff={staff}
        templates={templatesWithSubtasks}
      />
    </div>
  );
}
