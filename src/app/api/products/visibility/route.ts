import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setProductsCostingVisibility } from "@/lib/inventory/queries";
import { productVisibilityBulkSchema } from "@/lib/validation/product";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json().catch(() => ({}));
  const parsed = productVisibilityBulkSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  await setProductsCostingVisibility(supabase, parsed.data.ids, parsed.data.show_in_costing);
  return NextResponse.json({ ok: true });
}
