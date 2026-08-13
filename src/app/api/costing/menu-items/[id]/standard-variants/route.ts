import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createStandardVariants, getMenuItemWithIngredients } from "@/lib/costing/queries";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const menuItem = await getMenuItemWithIngredients(supabase, id);
  if (!menuItem) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  await createStandardVariants(supabase, id, menuItem.name);
  return NextResponse.json({ ok: true });
}
