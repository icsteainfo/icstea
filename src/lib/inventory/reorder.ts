import { formatNumber } from "@/lib/format";
import type { ProductWithStock } from "./types";

export type UsageStats = {
  dailyUsageRate: number | null; // 1日あたりの使用量(推定)。計算不可の場合はnull
  daysRemaining: number | null; // このペースで使い切るまでの日数。計算不可・減っていない場合はnull
};

export type ReorderStatus = {
  needsReorder: boolean;
  urgency: "none" | "watch" | "reorder_soon" | "below_safety_stock";
  reason: string;
};

// 直近2回の在庫記録から、1日あたりの使用量と残り日数を計算する(AI不使用の単純計算)。
export function computeUsageStats(product: ProductWithStock): UsageStats {
  const { latest_snapshot, previous_snapshot } = product;
  if (!latest_snapshot || !previous_snapshot) {
    return { dailyUsageRate: null, daysRemaining: null };
  }

  const daysBetween = daysBetweenDates(
    previous_snapshot.recorded_on,
    latest_snapshot.recorded_on,
  );
  if (daysBetween <= 0) {
    return { dailyUsageRate: null, daysRemaining: null };
  }

  const consumed = previous_snapshot.quantity - latest_snapshot.quantity;
  if (consumed <= 0) {
    // 減っていない(補充された、または変化なし)場合は「使い切る見込みなし」として扱う
    return { dailyUsageRate: 0, daysRemaining: null };
  }

  const dailyUsageRate = consumed / daysBetween;
  const daysRemaining = latest_snapshot.quantity / dailyUsageRate;

  return { dailyUsageRate, daysRemaining };
}

// 安全在庫を計算する。1日あたりの使用量が分かっていれば「使用量 × 安全在庫日数」で自動計算し、
// 使用量データがまだ不足している商品では、手動設定の安全在庫(safety_stock)を代わりに使う。
export function computeEffectiveSafetyStock(
  product: Pick<ProductWithStock, "safety_stock" | "safety_stock_days">,
  usage: UsageStats,
): number {
  if (usage.dailyUsageRate !== null && usage.dailyUsageRate > 0) {
    return Math.round(usage.dailyUsageRate * product.safety_stock_days);
  }
  return product.safety_stock;
}

// 「安全在庫」「リードタイム」を踏まえて発注が必要かどうかを判定する(AI不使用)。
export function computeReorderStatus(
  product: ProductWithStock,
  usage: UsageStats,
): ReorderStatus {
  const currentStock = product.latest_snapshot?.quantity ?? null;

  if (currentStock === null) {
    return {
      needsReorder: false,
      urgency: "none",
      reason: "在庫記録がまだありません",
    };
  }

  const safetyStock = computeEffectiveSafetyStock(product, usage);

  if (currentStock <= safetyStock) {
    return {
      needsReorder: true,
      urgency: "below_safety_stock",
      reason: `現在庫(${formatNumber(currentStock)}${product.unit})が安全在庫(${formatNumber(safetyStock)}${product.unit})を下回っています`,
    };
  }

  if (usage.dailyUsageRate === null || usage.dailyUsageRate <= 0) {
    return {
      needsReorder: false,
      urgency: "none",
      reason: "使用量データが不足しているか、在庫が減っていません",
    };
  }

  const projectedAtDelivery =
    currentStock - usage.dailyUsageRate * product.lead_time_days;

  if (projectedAtDelivery <= safetyStock) {
    const days = usage.daysRemaining ?? 0;
    return {
      needsReorder: true,
      urgency: "reorder_soon",
      reason: `このペースでは約${Math.round(days)}日で在庫切れの見込みです。納品まで${product.lead_time_days}日かかるため、発注タイミングに入っています`,
    };
  }

  return {
    needsReorder: false,
    urgency: "watch",
    reason: `現在のところ十分な在庫があります(残り約${Math.round(usage.daysRemaining ?? 0)}日分)`,
  };
}

function daysBetweenDates(from: string, to: string): number {
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  return Math.round(
    (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
  );
}
