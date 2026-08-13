import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProduct, createReorderTask } from "@/lib/inventory/queries";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const product = await getProduct(supabase, id);
  if (!product) {
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
  }

  const task = await createReorderTask(supabase, product.id, product.name);
  return NextResponse.json({ task });
}
