import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates/queries";
import { listCategories } from "@/lib/tasks/queries";
import { TemplateCategorySelect } from "@/components/templates/template-category-select";
import { TemplateSubtaskList } from "@/components/templates/template-subtask-list";
import { DeleteTemplateButton } from "@/components/templates/delete-template-button";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [template, categories] = await Promise.all([
    getTemplate(supabase, id),
    listCategories(supabase),
  ]);

  if (!template) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{template.name}</h1>
        <DeleteTemplateButton templateId={template.id} />
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">カテゴリー</h2>
        <p className="text-xs text-muted-foreground">
          このテンプレートから作成したタスクに設定されるカテゴリーです。
        </p>
        <TemplateCategorySelect
          templateId={template.id}
          categoryId={template.category_id}
          categories={categories}
        />
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">サブタスク</h2>
        <p className="text-xs text-muted-foreground">
          このテンプレートから大項目タスクを作成すると、ここに登録した内容がサブタスクとして自動で作られます。
        </p>
        <TemplateSubtaskList templateId={template.id} initialSubtasks={template.subtasks} />
      </div>
    </div>
  );
}
