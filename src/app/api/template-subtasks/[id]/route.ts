import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteTemplateSubtask, updateTemplateSubtask } from "@/lib/templates/queries";
import { templateSubtaskUpdateSchema } from "@/lib/validation/template";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = templateSubtaskUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const subtask = await updateTemplateSubtask(supabase, id, parsed.data);
  return NextResponse.json({ subtask });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  await deleteTemplateSubtask(supabase, id);
  return NextResponse.json({ ok: true });
}
