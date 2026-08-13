import { createClient } from "@/lib/supabase/server";
import { listTemplates } from "@/lib/templates/queries";
import { CreateFromTemplateForm } from "@/components/tasks/create-from-template-form";

export default async function NewTaskFromTemplatePage() {
  const supabase = await createClient();
  const templates = await listTemplates(supabase);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">テンプレートからタスク追加</h1>
      <CreateFromTemplateForm templates={templates} />
    </div>
  );
}
