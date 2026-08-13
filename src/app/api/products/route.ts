import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProduct, listProducts } from "@/lib/inventory/queries";
import { productInputSchema } from "@/lib/validation/product";

export async function GET() {
  const supabase = await createClient();
  const products = await listProducts(supabase);
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = productInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const product = await createProduct(supabase, parsed.data);
  return NextResponse.json({ product }, { status: 201 });
}
