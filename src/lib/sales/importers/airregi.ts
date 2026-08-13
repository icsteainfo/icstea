import { parseCsv, toNumber } from "@/lib/sales/csv";
import type { DailyChannelSales, MenuItemSales } from "@/lib/sales/types";

// AirレジのCSVには列見出しの日本語がある想定だが、書き出し設定によって表記ゆれがあるため、
// 見出しではなく列の並び順(実データから確認済みの構成)で読み取る。

function periodToDate(period: string): string {
  const digits = period.trim();
  if (digits.length !== 8) {
    throw new Error(
      "「売上集計」CSVは日別の期間で書き出してください(月別・年別の集計だと日付が特定できません)",
    );
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

// 「売上集計」CSV(集計期間, 売上, 客数, 客単価, 点数, 点単価, ..., 現金売上, 現金以外売上, ...)を取り込む。
export function parseAirregiSummaryCsv(
  text: string,
): Omit<DailyChannelSales, "id">[] {
  const rows = parseCsv(text).slice(1); // 先頭行は見出し

  return rows
    .filter((r) => r.length >= 3 && r[0])
    .map((r) => {
      const grossAmount = toNumber(r[1]);
      return {
        date: periodToDate(r[0]),
        channel: "airregi" as const,
        gross_amount: grossAmount,
        net_amount: grossAmount,
        order_count: Math.round(toNumber(r[2])),
      };
    });
}

// 「商品別売上」CSV(商品名, カテゴリー, 税区分, 売上, 構成比%, ..., 数量, ...)を取り込む。
// このCSV自体には日付の列がないため、対象日は呼び出し側(アップロード画面)で指定してもらう。
export function parseAirregiProductsCsv(
  text: string,
  date: string,
): Omit<MenuItemSales, "id" | "menu_item_id">[] {
  const rows = parseCsv(text).slice(1);

  return rows
    .filter((r) => r.length >= 8 && r[0])
    .map((r) => ({
      date,
      channel: "airregi" as const,
      external_name: r[0].trim(),
      quantity: toNumber(r[7]),
      gross_amount: toNumber(r[3]),
    }));
}

// 商品別CSVの2列目(カテゴリー)を商品名ごとに取り出す。menu_items自動登録時のカテゴリー初期値に使う。
export function parseAirregiProductCategories(text: string): Map<string, string> {
  const rows = parseCsv(text).slice(1);
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.length >= 2 && r[0] && r[1]) {
      map.set(r[0].trim(), r[1].trim());
    }
  }
  return map;
}
