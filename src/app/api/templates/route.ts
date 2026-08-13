import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTemplate, listTemplates } from "@/lib/templates/queries";
import { templateInputSchema } from "@/lib/validation/template";

export async function GET() {
  const supabase = await createClient();
  const templates = await listTemplates(supabase);
  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = templateInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const template = await createTemplate(supabase, parsed.data.name);
  return NextResponse.json({ template }, { status: 201 });
}
