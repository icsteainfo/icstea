import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getTodayDateString } from "@/lib/date";
import { fetchTeaStockFromSheet } from "@/lib/sheets/inventory-import";
import {
  getLatestSnapshotsBefore,
  getOrCreateProductsByName,
  logProductEvent,
  setProductDisplayColor,
  setProductSortOrder,
  upsertStockSnapshot,
} from "./queries";

type Client = SupabaseClient<Database>;

export type InventorySyncResult = {
  recordedOn: string;
  productsAdded: number;
  snapshotsRecorded: number;
  restocksDetected: number;
};

// スプレッドシートの茶葉在庫を読み取り、
// 1) 未登録の商品があれば自動で商品マスタに追加し、
// 2) 今日の日付で在庫記録(stock_snapshots)を保存し、
// 3) 前回より在庫が増えていれば「入荷した」とみなして最終入荷日を自動で記録する。
// これにより、納品があったときはスプレッドシートを更新するだけでよく、
// アプリ側で別途ボタンを押す必要がない。
export async function syncInventoryFromSheet(
  supabase: Client,
): Promise<InventorySyncResult> {
  const rows = await fetchTeaStockFromSheet();
  const recordedOn = getTodayDateString();

  const { byName, addedCount } = await getOrCreateProductsByName(
    supabase,
    rows.map((r) => r.name),
    "茶葉",
  );

  const previousSnapshots = await getLatestSnapshotsBefore(
    supabase,
    [...byName.values()].map((p) => p.id),
    recordedOn,
  );

  let restocksDetected = 0;

  for (const [index, row] of rows.entries()) {
    const product = byName.get(row.name);
    if (!product) continue;
    await upsertStockSnapshot(supabase, {
      product_id: product.id,
      recorded_on: recordedOn,
      quantity: row.quantity,
      kitchen_back: row.kitchenBack,
      under_chair: row.underChair,
      office: row.office,
      warehouse: row.warehouse,
    });
    // スプレッドシート上の並び順をそのままアプリの表示順にする
    if (product.sort_order !== index) {
      await setProductSortOrder(supabase, product.id, index);
    }
    // スプレッドシートのセルの色をそのままアプリの表示色にする
    if (product.display_color !== row.color) {
      await setProductDisplayColor(supabase, product.id, row.color);
    }

    const previous = previousSnapshots.get(product.id);
    if (previous && row.quantity > previous.quantity) {
      await logProductEvent(supabase, product.id, "received", recordedOn);
      restocksDetected += 1;
    }
  }

  return {
    recordedOn,
    productsAdded: addedCount,
    snapshotsRecorded: rows.length,
    restocksDetected,
  };
}
