import { createClient } from "@/lib/supabase/server";
import {
  getSalesTarget,
  listDailyChannelSales,
  listMenuItemSalesWithNames,
} from "@/lib/sales/queries";
import { getTodayDateString } from "@/lib/date";
import {
  aggregateByCategory,
  aggregateByMenuItem,
  getChangeRate,
  getMonthEndForecast,
  getPeriodRange,
  getWeekAgoRange,
  getYearAgoRange,
  sumTotals,
  type Period,
} from "@/lib/sales/analysis";
import { SalesImportForm } from "@/components/sales/sales-import-form";
import { SalesTargetForm } from "@/components/sales/sales-target-form";
import { SalesPeriodTabs } from "@/components/sales/sales-period-tabs";
import { formatPercent, formatYen } from "@/lib/sales/format";
import { IdolBadge } from "@/components/idol/idol-image";
import type { Channel } from "@/lib/sales/types";

const CHANNEL_LABELS: Record<Channel, string> = {
  airregi: "エアレジ",
  uber_eats: "Uber Eats",
  rocket_now: "ロケットナウ",
  stores: "STORES",
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const today = getTodayDateString();

  const period: Period =
    params.period === "daily" || params.period === "weekly" ? params.period : "monthly";
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;

  const currentRange = getPeriodRange(period, date);
  const yearAgoRange = getYearAgoRange(period, date);
  const weekAgoRange = period === "daily" ? getWeekAgoRange(date) : null;
  const month = date.slice(0, 7);

  const [currentRows, yearAgoRows, weekAgoRows, menuItemRows, target] = await Promise.all([
    listDailyChannelSales(supabase, { from: currentRange.start, to: currentRange.end }),
    listDailyChannelSales(supabase, { from: yearAgoRange.start, to: yearAgoRange.end }),
    weekAgoRange
      ? listDailyChannelSales(supabase, { from: weekAgoRange.start, to: weekAgoRange.end })
      : Promise.resolve([]),
    listMenuItemSalesWithNames(supabase, { from: currentRange.start, to: currentRange.end }),
    getSalesTarget(supabase, month),
  ]);

  const totals = sumTotals(currentRows);
  const yearAgoTotals = sumTotals(yearAgoRows);
  const weekAgoTotals = weekAgoRows.length > 0 ? sumTotals(weekAgoRows) : null;
  const yoyRate = getChangeRate(totals.gross, yearAgoTotals.gross);
  const wowRate = weekAgoTotals ? getChangeRate(totals.gross, weekAgoTotals.gross) : null;
  const forecast =
    period === "monthly" ? getMonthEndForecast(currentRange, totals.gross, today) : null;
  const achievementRate =
    period === "monthly" && target ? (totals.gross / target.target_amount) * 100 : null;

  const menuItemAgg = aggregateByMenuItem(menuItemRows).slice(0, 20);
  const categoryAgg = aggregateByCategory(menuItemRows);

  const byChannel = new Map<Channel, ReturnType<typeof sumTotals>>();
  for (const channel of Object.keys(CHANNEL_LABELS) as Channel[]) {
    const rows = currentRows.filter((r) => r.channel === channel);
    if (rows.length > 0) byChannel.set(channel, sumTotals(rows));
  }

  const byDate = new Map<string, typeof currentRows>();
  for (const row of currentRows) {
    const list = byDate.get(row.date) ?? [];
    list.push(row);
    byDate.set(row.date, list);
  }
  const dates = [...byDate.keys()].sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">売上分析</h1>
          <p className="text-sm text-muted-foreground">
            金額の集計・前年比較・構成比などはすべてAIを使わない自動計算です。
          </p>
        </div>
        <IdolBadge imageKey="analytics" />
      </div>

      <SalesPeriodTabs period={period} date={date} range={currentRange} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">総売上</p>
          <p className="text-2xl font-semibold">{formatYen(totals.gross)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">実質売上(手数料控除後)</p>
          <p className="text-2xl font-semibold">{formatYen(totals.net)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">客数</p>
          <p className="text-2xl font-semibold">{totals.orderCount.toLocaleString("ja-JP")}人</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">客単価</p>
          <p className="text-2xl font-semibold">{formatYen(totals.avgSpend)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">前年同期間比</p>
          <p className="text-2xl font-semibold">{formatPercent(yoyRate)}</p>
        </div>
        {period === "daily" && (
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">前週同曜日比</p>
            <p className="text-2xl font-semibold">{formatPercent(wowRate)}</p>
          </div>
        )}
        {period === "monthly" && (
          <>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">目標達成率(総売上ベース)</p>
              <p className="text-2xl font-semibold">
                {achievementRate !== null ? `${achievementRate.toFixed(1)}%` : "目標未設定"}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">月末着地予測</p>
              <p className="text-2xl font-semibold">
                {forecast !== null ? formatYen(forecast) : "-"}
              </p>
            </div>
          </>
        )}
      </div>

      {period === "monthly" && (
        <SalesTargetForm month={month} initialTarget={target?.target_amount ?? null} />
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">チャネル別内訳</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">チャネル</th>
                <th className="px-3 py-2">総売上</th>
                <th className="px-3 py-2">実質売上</th>
                <th className="px-3 py-2">件数</th>
              </tr>
            </thead>
            <tbody>
              {[...byChannel.entries()].map(([channel, t]) => (
                <tr key={channel} className="border-t">
                  <td className="px-3 py-2">{CHANNEL_LABELS[channel]}</td>
                  <td className="px-3 py-2">{formatYen(t.gross)}</td>
                  <td className="px-3 py-2">{formatYen(t.net)}</td>
                  <td className="px-3 py-2">{t.orderCount}</td>
                </tr>
              ))}
              {byChannel.size === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {period !== "daily" && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">日別内訳</h2>
          <div className="space-y-2">
            {dates.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">データがありません</p>
            )}
            {dates.map((d) => {
              const dayRows = byDate.get(d)!;
              const dayTotals = sumTotals(dayRows);
              return (
                <div key={d} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">{d}</span>
                    <span className="text-muted-foreground">
                      総売上 {formatYen(dayTotals.gross)} / 実質売上 {formatYen(dayTotals.net)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">商品別売上</h2>
          <p className="text-xs text-muted-foreground">
            現在は商品別データを取得できるチャネル(エアレジ)分のみ反映されています。
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">商品名</th>
                  <th className="px-3 py-2">数量</th>
                  <th className="px-3 py-2">売上</th>
                  <th className="px-3 py-2">構成比</th>
                </tr>
              </thead>
              <tbody>
                {menuItemAgg.map((item) => (
                  <tr key={item.key} className="border-t">
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{formatYen(item.gross)}</td>
                    <td className="px-3 py-2">{item.share.toFixed(1)}%</td>
                  </tr>
                ))}
                {menuItemAgg.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                      データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">カテゴリー別売上</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">カテゴリー</th>
                  <th className="px-3 py-2">数量</th>
                  <th className="px-3 py-2">売上</th>
                  <th className="px-3 py-2">構成比</th>
                </tr>
              </thead>
              <tbody>
                {categoryAgg.map((item) => (
                  <tr key={item.key} className="border-t">
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{formatYen(item.gross)}</td>
                    <td className="px-3 py-2">{item.share.toFixed(1)}%</td>
                  </tr>
                ))}
                {categoryAgg.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                      データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SalesImportForm />
    </div>
  );
}
