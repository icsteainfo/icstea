import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listCategories, listStaff, listTasks } from "@/lib/tasks/queries";
import { listTemplates, listTemplateSubtasks } from "@/lib/templates/queries";
import { parseBulkTodos } from "@/lib/ai/bulk-import";
import { bulkImportParseRequestSchema } from "@/lib/validation/bulk-import";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = bulkImportParseRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const [categories, staff, templates, openTasks] = await Promise.all([
    listCategories(supabase),
    listStaff(supabase),
    listTemplates(supabase),
    listTasks(supabase, { status: "open" }),
  ]);

  const templatesWithSubtasks = await Promise.all(
    templates.map(async (template) => {
      const subtasks = await listTemplateSubtasks(supabase, template.id);
      return {
        id: template.id,
        name: template.name,
        categoryName: template.category_name,
        subtaskTitles: subtasks.map((subtask) => subtask.title),
      };
    }),
  );

  const result = await parseBulkTodos({
    text: parsed.data.text,
    categories: categories.map((category) => ({ id: category.id, name: category.name })),
    staff: staff.map((member) => ({ id: member.id, name: member.name })),
    templates: templatesWithSubtasks,
    openTasks: openTasks.map((task) => ({ id: task.id, title: task.title })),
  });

  return NextResponse.json(result);
}
