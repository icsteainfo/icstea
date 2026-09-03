import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteInitiative, getInitiative, updateInitiative } from "@/lib/initiatives/queries";
import { initiativeUpdateSchema } from "@/lib/validation/initiative";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const initiative = await getInitiative(supabase, id);

  if (!initiative) {
    return NextResponse.json({ error: "取り組みが見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ initiative });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = initiativeUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const initiative = await updateInitiative(supabase, id, parsed.data);
  return NextResponse.json({ initiative });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  await deleteInitiative(supabase, id);
  return NextResponse.json({ ok: true });
}
