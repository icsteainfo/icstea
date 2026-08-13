import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteTemplate, getTemplate, updateTemplate } from "@/lib/templates/queries";
import { templateUpdateSchema } from "@/lib/validation/template";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const template = await getTemplate(supabase, id);

  if (!template) {
    return NextResponse.json({ error: "テンプレートが見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ template });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = templateUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const template = await updateTemplate(supabase, id, parsed.data);
  return NextResponse.json({ template });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  await deleteTemplate(supabase, id);
  return NextResponse.json({ ok: true });
}
