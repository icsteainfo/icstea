import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTask } from "@/lib/tasks/queries";
import { createSubtask, setSubtaskCompletion } from "@/lib/subtasks/queries";
import { bulkImportConfirmRequestSchema } from "@/lib/validation/bulk-import";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = bulkImportConfirmRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const createdTaskIds: string[] = [];

  for (const item of parsed.data.items) {
    if (item.action === "create") {
      const task = await createTask(supabase, {
        title: item.title,
        category_id: item.categoryId ?? undefined,
        assignee_type: item.assigneeStaffId ? "staff" : "owner",
        assignee_staff_id: item.assigneeStaffId ?? undefined,
        due_date: item.dueDate ?? undefined,
        priority_level: item.priority,
      });

      for (const subtask of item.subtasks) {
        const created = await createSubtask(supabase, task.id, {
          title: subtask.title,
          assignee_type: "owner",
        });
        if (subtask.completed) {
          await setSubtaskCompletion(supabase, created.id, true);
        }
      }

      createdTaskIds.push(task.id);
    } else {
      const targetTaskId = item.targetExistingTaskId as string;
      const subtasksToAdd =
        item.subtasks.length > 0 ? item.subtasks : [{ title: item.title, completed: false }];

      for (const subtask of subtasksToAdd) {
        const created = await createSubtask(supabase, targetTaskId, {
          title: subtask.title,
          assignee_type: "owner",
        });
        if (subtask.completed) {
          await setSubtaskCompletion(supabase, created.id, true);
        }
      }

      createdTaskIds.push(targetTaskId);
    }
  }

  return NextResponse.json({ taskIds: createdTaskIds }, { status: 201 });
}
