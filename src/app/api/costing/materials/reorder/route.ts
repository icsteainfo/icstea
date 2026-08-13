import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reorderMaterials } from "@/lib/inventory/queries";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds : null;

  if (!orderedIds) {
    return NextResponse.json({ error: "orderedIdsが必要です" }, { status: 400 });
  }

  await reorderMaterials(supabase, orderedIds);
  return NextResponse.json({ ok: true });
}
