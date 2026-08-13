import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deactivateProduct,
  getProduct,
  updateProduct,
} from "@/lib/inventory/queries";
import { productUpdateSchema } from "@/lib/validation/product";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const product = await getProduct(supabase, id);
  if (!product) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = productUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const product = await updateProduct(supabase, id, parsed.data);
  return NextResponse.json({ product });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  await deactivateProduct(supabase, id);
  return NextResponse.json({ ok: true });
}
