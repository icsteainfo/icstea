import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";
import { listCategories } from "@/lib/tasks/queries";
import { ProjectForm } from "@/components/projects/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [project, categories] = await Promise.all([
    getProject(supabase, id),
    listCategories(supabase),
  ]);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">プロジェクト編集</h1>
      <ProjectForm mode="edit" project={project} categories={categories} />
    </div>
  );
}
