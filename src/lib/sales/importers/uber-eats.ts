import { parseCsv, toNumber } from "@/lib/sales/csv";
import type { DailyChannelSales } from "@/lib/sales/types";

const COMMISSION_RATE = 0.35;

// Uber Eatsの「sales-over-time」CSV(期間, 開始日, 終了日, 期間増分, ...,
// お持ち帰り売上, 出前売上, 売り上げ, ..., 注文, ...)を取り込む。
// 「日」単位の行のみを対象とし(週・月単位の行は日付が特定できないため除外)、開始日を対象日として扱う。
export function parseUberEatsCsv(text: string): Omit<DailyChannelSales, "id">[] {
  const rows = parseCsv(text).slice(1);

  return rows
    .filter((r) => r.length >= 10 && r[3]?.trim() === "日")
    .map((r) => {
      const grossAmount = toNumber(r[6]);
      return {
        date: r[1].trim().slice(0, 10),
        channel: "uber_eats" as const,
        gross_amount: grossAmount,
        net_amount: Math.round(grossAmount * (1 - COMMISSION_RATE)),
        order_count: Math.round(toNumber(r[9])),
      };
    });
}
