import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTask, listTasks } from "@/lib/tasks/queries";
import { taskInputSchema } from "@/lib/validation/task";
import type { AssigneeType, TaskStatus } from "@/types/database.types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const params = request.nextUrl.searchParams;

  const tasks = await listTasks(supabase, {
    status: (params.get("status") as TaskStatus) || undefined,
    categoryId: params.get("category_id") || undefined,
    assigneeType: (params.get("assignee_type") as AssigneeType) || undefined,
    assigneeStaffId: params.get("assignee_staff_id") || undefined,
    isWaiting:
      params.get("is_waiting") === null
        ? undefined
        : params.get("is_waiting") === "true",
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = taskInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const task = await createTask(supabase, parsed.data);
  return NextResponse.json({ task }, { status: 201 });
}
