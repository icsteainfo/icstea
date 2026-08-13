import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTemplateFromTask } from "@/lib/templates/queries";
import { createTemplateFromTaskSchema } from "@/lib/validation/template";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = createTemplateFromTaskSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const template = await createTemplateFromTask(
    supabase,
    parsed.data.task_id,
    parsed.data.name,
  );

  return NextResponse.json({ template }, { status: 201 });
}
