import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncInventoryFromSheet } from "@/lib/inventory/sync";

export async function POST() {
  const supabase = await createClient();

  let result;
  try {
    result = await syncInventoryFromSheet(supabase);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "在庫の取り込みでエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(result);
}
