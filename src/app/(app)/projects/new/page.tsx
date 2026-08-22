import { createClient } from "@/lib/supabase/server";
import { listCategories } from "@/lib/tasks/queries";
import { ProjectForm } from "@/components/projects/project-form";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const categories = await listCategories(supabase);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">プロジェクト追加</h1>
      <ProjectForm mode="create" categories={categories} />
    </div>
  );
}
