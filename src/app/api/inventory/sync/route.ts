import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncInventoryFromSheet } from "@/lib/inventory/sync";
import { syncInventoryCheckFromSheet } from "@/lib/inventory/inventory-check-sync";

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

  // 在庫チェック(◎/×)連携は別タブを読むため、万一エラーになっても
  // 既存の茶葉在庫の同期(上のresult)は成功したまま返す。
  let checkResult;
  let checkError: string | null = null;
  try {
    checkResult = await syncInventoryCheckFromSheet(supabase);
  } catch (err) {
    checkError = err instanceof Error ? err.message : "在庫チェック連携でエラーが発生しました";
  }

  return NextResponse.json({ ...result, check: checkResult, checkError });
}
