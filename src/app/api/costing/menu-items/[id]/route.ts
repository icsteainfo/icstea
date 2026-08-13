import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMenuItemWithIngredients,
  replaceMenuItemIngredients,
  updateMenuItem,
} from "@/lib/costing/queries";
import { menuItemSaveSchema } from "@/lib/validation/costing";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const menuItem = await getMenuItemWithIngredients(supabase, id);
  if (!menuItem) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ menuItem });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = menuItemSaveSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const menuItem = await updateMenuItem(supabase, id, parsed.data.menuItem);
  if (parsed.data.ingredients !== undefined) {
    await replaceMenuItemIngredients(supabase, id, parsed.data.ingredients);
  }
  return NextResponse.json({ menuItem });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_active: false })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
