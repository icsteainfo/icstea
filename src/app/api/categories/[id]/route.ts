import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deactivateCategory, renameCategory } from "@/lib/tasks/queries";
import { nameInputSchema } from "@/lib/validation/settings";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = nameInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const category = await renameCategory(supabase, id, parsed.data.name);
  return NextResponse.json({ category });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  await deactivateCategory(supabase, id);
  return NextResponse.json({ ok: true });
}
