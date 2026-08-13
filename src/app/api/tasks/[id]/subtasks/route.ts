import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubtask } from "@/lib/subtasks/queries";
import { subtaskInputSchema } from "@/lib/validation/subtask";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = subtaskInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const subtask = await createSubtask(supabase, id, parsed.data);
  return NextResponse.json({ subtask }, { status: 201 });
}
