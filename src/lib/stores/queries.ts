import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  fetchAllUnshippedOrders,
  fetchShippedOrderIds,
  type StoresOrder,
} from "./client";

type Client = SupabaseClient<Database>;

const CATEGORY_NAME = "EC・オンラインショップ";

function formatOrderedAt(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function buildOrderTaskMemo(order: StoresOrder): string {
  const shippingDelivery = order.deliveries.find(
    (d) => d.type === "shipping",
  );
  const recipientName = shippingDelivery?.shipping_address
    ? `${shippingDelivery.shipping_address.last_name} ${shippingDelivery.shipping_address.first_name} 様`
    : null;

  const lines = [
    `注文番号: ${order.number}`,
    `注文日時: ${formatOrderedAt(order.ordered_at)}`,
    recipientName ? `お届け先: ${recipientName}` : null,
    `金額: ¥${order.payment_amount.toLocaleString("ja-JP")}`,
    order.remarks ? `購入者コメント: ${order.remarks}` : null,
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

async function getEcCategoryId(supabase: Client): Promise<string | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("name", CATEGORY_NAME)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

// 未発送のSTORES注文のうち、まだタスク化していないものを新規作成する。
// 既にタスク化済み(完了済みも含む)の注文idはstores_order_idで判定し、重複作成しない。
async function createMissingOrderTasks(
  supabase: Client,
  unshippedOrders: StoresOrder[],
): Promise<number> {
  if (unshippedOrders.length === 0) return 0;

  const { data: existing, error } = await supabase
    .from("tasks")
    .select("stores_order_id")
    .not("stores_order_id", "is", null);
  if (error) throw error;
  const existingIds = new Set(
    (existing ?? []).map((t) => t.stores_order_id as string),
  );

  const missingOrders = unshippedOrders.filter((o) => !existingIds.has(o.id));
  if (missingOrders.length === 0) return 0;

  const categoryId = await getEcCategoryId(supabase);

  const { error: insertError } = await supabase.from("tasks").insert(
    missingOrders.map((order) => ({
      title: `STORES注文 #${order.number} を発送する`,
      memo: buildOrderTaskMemo(order),
      category_id: categoryId,
      assignee_type: "owner" as const,
      priority_level: "high" as const,
      stores_order_id: order.id,
    })),
  );
  if (insertError) throw insertError;

  return missingOrders.length;
}

// STORES上で発送済みになった注文について、紐づく未完了タスクを自動完了する。
async function completeShippedOrderTasks(supabase: Client): Promise<number> {
  const { data: openTracked, error } = await supabase
    .from("tasks")
    .select("id, stores_order_id")
    .eq("status", "open")
    .not("stores_order_id", "is", null);
  if (error) throw error;
  if (!openTracked || openTracked.length === 0) return 0;

  const trackedIds = openTracked.map((t) => t.stores_order_id as string);
  const shippedIds = await fetchShippedOrderIds(trackedIds);
  if (shippedIds.size === 0) return 0;

  const taskIdsToComplete = openTracked
    .filter((t) => shippedIds.has(t.stores_order_id as string))
    .map((t) => t.id);
  if (taskIdsToComplete.length === 0) return 0;

  const { error: updateError } = await supabase
    .from("tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .in("id", taskIdsToComplete);
  if (updateError) throw updateError;

  return taskIdsToComplete.length;
}

export async function syncStoresOrders(
  supabase: Client,
): Promise<{ createdCount: number; completedCount: number }> {
  const unshippedOrders = await fetchAllUnshippedOrders();
  const createdCount = await createMissingOrderTasks(
    supabase,
    unshippedOrders,
  );
  const completedCount = await completeShippedOrderTasks(supabase);
  return { createdCount, completedCount };
}
