import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteTask, getTask, updateTask } from "@/lib/tasks/queries";
import { taskUpdateSchema } from "@/lib/validation/task";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const task = await getTask(supabase, id);

  if (!task) {
    return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ task });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = taskUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const task = await updateTask(supabase, id, parsed.data);
  return NextResponse.json({ task });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  await deleteTask(supabase, id);
  return NextResponse.json({ ok: true });
}
