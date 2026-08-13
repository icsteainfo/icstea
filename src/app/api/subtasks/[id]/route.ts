import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteSubtask, updateSubtask } from "@/lib/subtasks/queries";
import { subtaskUpdateSchema } from "@/lib/validation/subtask";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = subtaskUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const subtask = await updateSubtask(supabase, id, parsed.data);
  return NextResponse.json({ subtask });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  await deleteSubtask(supabase, id);
  return NextResponse.json({ ok: true });
}
