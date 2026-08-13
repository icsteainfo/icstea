import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createMenuItem,
  createStandardVariants,
  listMenuItemsForCosting,
  replaceMenuItemIngredients,
} from "@/lib/costing/queries";
import { menuItemSaveSchema } from "@/lib/validation/costing";

export async function GET() {
  const supabase = await createClient();
  const menuItems = await listMenuItemsForCosting(supabase);
  return NextResponse.json({ menuItems });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = menuItemSaveSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const menuItem = await createMenuItem(supabase, parsed.data.menuItem);
  await replaceMenuItemIngredients(supabase, menuItem.id, parsed.data.ingredients ?? []);

  // 新しい商品(親)を作った時は、基本形のHOT/ICE×S/M/Lの6バリエーションを自動で作成する。
  // (すでに親が指定されている=バリエーション自体の作成時は対象外)
  if (parsed.data.menuItem.parent_menu_item_id == null) {
    await createStandardVariants(supabase, menuItem.id, menuItem.name);
  }

  return NextResponse.json({ menuItem }, { status: 201 });
}
