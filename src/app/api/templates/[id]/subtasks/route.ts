import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTemplateSubtask } from "@/lib/templates/queries";
import { templateSubtaskInputSchema } from "@/lib/validation/template";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = templateSubtaskInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const subtask = await createTemplateSubtask(supabase, id, parsed.data);
  return NextResponse.json({ subtask }, { status: 201 });
}
