import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { fetchSheetRange } from "@/lib/sheets/client";
import {
  cleanProductName,
  computeShortage,
  parseInventoryCheckRows,
} from "@/lib/sheets/inventory-check-import";
import { getTodayDateString } from "@/lib/date";
import { updateTask } from "@/lib/tasks/queries";
import {
  createReorderTask,
  findOpenReorderTask,
  getOrCreateProductsByName,
  resolveReorderTask,
} from "./queries";

type Client = SupabaseClient<Database>;

// 「在庫管理」タブの上側にある定期在庫チェック表を読む(72行目以降の茶葉詳細在庫表とは別物)。
const SHEET_TAB_NAME = "在庫管理";
const NEW_PRODUCT_CATEGORY = "その他店舗備品";

export type InventoryCheckSyncResult = {
  processed: number;
  tasksCreated: number;
  tasksUpdated: number;
  tasksResolved: number;
};

function buildMemo(params: {
  required: string;
  current: string;
  shortage: number | null;
  checkedOn: string;
  sheetMemo: string;
  rawName: string;
  cleanedName: string;
}): string {
  const lines = [
    `必要在庫: ${params.required || "(未記入)"}`,
    `現在在庫: ${params.current || "(未記入)"}`,
  ];
  if (params.shortage !== null) {
    lines.push(`不足: ${params.shortage}`);
  }
  lines.push(`在庫チェック日: ${params.checkedOn}`);
  if (params.sheetMemo) {
    lines.push(`参考(スプレッドシートのメモ): ${params.sheetMemo}`);
  }
  if (params.rawName !== params.cleanedName) {
    lines.push(`置き場所など: ${params.rawName}`);
  }
  return lines.join("\n");
}

// 「在庫管理」タブ上側の定期在庫チェック表を読み取り、×判定の商品ごとに発注Todoを作成/更新する。
// 既に未完了の発注Todoがある商品は、新しく作らずメモだけを最新の内容に更新する。
// ×以外(⭕など)に変わった商品は、前回×だった名残の未完了Todoがあれば自動完了にする。
export async function syncInventoryCheckFromSheet(
  supabase: Client,
): Promise<InventoryCheckSyncResult> {
  // 72行目以降は別の表(茶葉詳細在庫)なので、その手前までを読めば十分。
  const rows = await fetchSheetRange(`'${SHEET_TAB_NAME}'!A1:J100`);
  const parsed = parseInventoryCheckRows(rows);
  const needsReorder = parsed.filter((row) => row.judgment.trim() === "×");
  const resolved = parsed.filter((row) => row.judgment.trim() !== "×");

  const checkedOn = getTodayDateString();

  let tasksCreated = 0;
  let tasksUpdated = 0;
  let tasksResolved = 0;

  if (needsReorder.length > 0) {
    const cleanedNames = needsReorder.map((row) => cleanProductName(row.name));
    const { byName } = await getOrCreateProductsByName(
      supabase,
      [...new Set(cleanedNames)],
      NEW_PRODUCT_CATEGORY,
    );

    for (const row of needsReorder) {
      const cleanedName = cleanProductName(row.name);
      const product = byName.get(cleanedName);
      if (!product) continue;

      const shortage = computeShortage(row.required, row.current);
      const memo = buildMemo({
        required: row.required,
        current: row.current,
        shortage,
        checkedOn,
        sheetMemo: row.memo,
        rawName: row.name,
        cleanedName,
      });

      const existingTask = await findOpenReorderTask(supabase, product.id);
      let taskId: string;
      if (existingTask) {
        await updateTask(supabase, existingTask.id, { memo });
        taskId = existingTask.id;
        tasksUpdated += 1;
      } else {
        const task = await createReorderTask(supabase, product.id, cleanedName, memo);
        taskId = task.id;
        tasksCreated += 1;
      }

      const { error } = await supabase.from("inventory_check_results").upsert(
        {
          checked_on: checkedOn,
          product_id: product.id,
          product_name: cleanedName,
          required_text: row.required || null,
          current_text: row.current || null,
          shortage,
          task_id: taskId,
        },
        { onConflict: "checked_on,product_id" },
      );
      if (error) throw error;
    }
  }

  if (resolved.length > 0) {
    const cleanedResolvedNames = [...new Set(resolved.map((row) => cleanProductName(row.name)))];
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name")
      .in("name", cleanedResolvedNames);
    if (productsError) throw productsError;

    for (const product of products ?? []) {
      const openTask = await findOpenReorderTask(supabase, product.id);
      if (!openTask) continue; // もともと発注Todoが無い商品(=不足していなかった)は対象外

      await resolveReorderTask(supabase, openTask.id, checkedOn);
      tasksResolved += 1;
    }
  }

  return { processed: needsReorder.length, tasksCreated, tasksUpdated, tasksResolved };
}
