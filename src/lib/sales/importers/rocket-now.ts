import { parseCsv, toNumber } from "@/lib/sales/csv";
import type { DailyChannelSales } from "@/lib/sales/types";

// ロケットナウの実際のCSV/Excel書き出し列名はまだ確認できていないため、
// 共有いただいた注文明細レポート(PDF)の列名をもとに、見出しの文字列一致で列を探す方式にしている。
// 実際のファイルで列名が違う場合はここを調整する必要がある。
function findColumnIndex(headers: string[], mustInclude: string, mustExclude: string[] = []): number {
  const index = headers.findIndex(
    (h) => h.includes(mustInclude) && !mustExclude.some((ex) => h.includes(ex)),
  );
  if (index === -1) {
    throw new Error(
      `ロケットナウのCSVに「${mustInclude}」列が見つかりませんでした。実際の列見出しを確認させてください`,
    );
  }
  return index;
}

// 注文明細レポート(取引日, 注文番号, 売上高, 店舗負担クーポン金額, 総手数料, 消費税, 精算予定金額 等、
// 1注文1行)を取り込み、日別に合算する。
export function parseRocketNowCsv(text: string): Omit<DailyChannelSales, "id">[] {
  const allRows = parseCsv(text);
  const headers = allRows[0];
  const rows = allRows.slice(1);

  const dateCol = findColumnIndex(headers, "取引日", ["取引日時"]);
  const grossCol = findColumnIndex(headers, "売上高");
  const settlementCol = findColumnIndex(headers, "精算予定金額");

  const byDate = new Map<string, { gross: number; net: number; count: number }>();

  for (const r of rows) {
    const date = r[dateCol]?.trim();
    if (!date) continue;

    const entry = byDate.get(date) ?? { gross: 0, net: 0, count: 0 };
    entry.gross += toNumber(r[grossCol]);
    entry.net += toNumber(r[settlementCol]);
    entry.count += 1;
    byDate.set(date, entry);
  }

  return Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    channel: "rocket_now" as const,
    gross_amount: v.gross,
    net_amount: v.net,
    order_count: v.count,
  }));
}
