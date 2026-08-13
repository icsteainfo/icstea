import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTaskFromTemplate } from "@/lib/templates/queries";
import { createTaskFromTemplateSchema } from "@/lib/validation/template";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = createTaskFromTemplateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const task = await createTaskFromTemplate(
    supabase,
    parsed.data.template_id,
    parsed.data.title,
  );
  return NextResponse.json({ task }, { status: 201 });
}
