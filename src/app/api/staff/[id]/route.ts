import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deactivateStaff, renameStaff } from "@/lib/tasks/queries";
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

  const staff = await renameStaff(supabase, id, parsed.data.name);
  return NextResponse.json({ staff });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  await deactivateStaff(supabase, id);
  return NextResponse.json({ ok: true });
}
