// 施策の前後で売上・販売数がどう変化したかを比較するロジック(AI不使用、ルールベースの計算のみ)。

import type { DailyChannelSales, MenuItemSales } from "@/lib/sales/types";
import type { MarketingCampaign } from "./types";

function shiftDateByDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function changeRate(before: number | null, after: number | null): number | null {
  if (before === null || after === null || before === 0) return null;
  return ((after - before) / before) * 100;
}

function sumGrossByDate(rows: DailyChannelSales[]): number[] {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.date, (map.get(r.date) ?? 0) + r.gross_amount);
  return [...map.values()];
}

export type CampaignImpact = {
  windowDays: number;
  beforeAvgQuantity: number | null;
  afterAvgQuantity: number | null;
  beforeAvgGross: number | null;
  afterAvgGross: number | null;
  quantityChangeRate: number | null;
  grossChangeRate: number | null;
  beforeDaysWithData: number;
  afterDaysWithData: number;
};

// 施策日の前後windowDays日間で、平均販売数・平均売上がどう変化したかを計算する。
// 対象商品が指定されている場合はその商品のmenu_item_salesの行(呼び出し側で絞り込み済み)を、
// 店舗全体施策の場合はdaily_channel_sales(全チャネル)を使う。
export function getCampaignImpact(
  campaign: MarketingCampaign,
  windowDays: number,
  menuItemSalesForProduct: MenuItemSales[],
  dailyChannelSales: DailyChannelSales[],
): CampaignImpact {
  const beforeStart = shiftDateByDays(campaign.date, -windowDays);
  const beforeEnd = shiftDateByDays(campaign.date, -1);
  const afterStart = shiftDateByDays(campaign.date, 1);
  const afterEnd = shiftDateByDays(campaign.date, windowDays);

  if (campaign.menu_item_id) {
    const beforeRows = menuItemSalesForProduct.filter(
      (r) => r.date >= beforeStart && r.date <= beforeEnd,
    );
    const afterRows = menuItemSalesForProduct.filter(
      (r) => r.date >= afterStart && r.date <= afterEnd,
    );
    const beforeAvgQuantity = average(beforeRows.map((r) => r.quantity));
    const afterAvgQuantity = average(afterRows.map((r) => r.quantity));
    const beforeAvgGross = average(beforeRows.map((r) => r.gross_amount));
    const afterAvgGross = average(afterRows.map((r) => r.gross_amount));
    return {
      windowDays,
      beforeAvgQuantity,
      afterAvgQuantity,
      beforeAvgGross,
      afterAvgGross,
      quantityChangeRate: changeRate(beforeAvgQuantity, afterAvgQuantity),
      grossChangeRate: changeRate(beforeAvgGross, afterAvgGross),
      beforeDaysWithData: beforeRows.length,
      afterDaysWithData: afterRows.length,
    };
  }

  const beforeDaily = sumGrossByDate(
    dailyChannelSales.filter((r) => r.date >= beforeStart && r.date <= beforeEnd),
  );
  const afterDaily = sumGrossByDate(
    dailyChannelSales.filter((r) => r.date >= afterStart && r.date <= afterEnd),
  );
  const beforeAvgGross = average(beforeDaily);
  const afterAvgGross = average(afterDaily);

  return {
    windowDays,
    beforeAvgQuantity: null,
    afterAvgQuantity: null,
    beforeAvgGross,
    afterAvgGross,
    quantityChangeRate: null,
    grossChangeRate: changeRate(beforeAvgGross, afterAvgGross),
    beforeDaysWithData: beforeDaily.length,
    afterDaysWithData: afterDaily.length,
  };
}
