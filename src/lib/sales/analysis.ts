// 売上分析ページで使う集計・比較のロジック(すべてAI不使用、ルールベースの計算のみ)。

import { getLastDayOfMonth, getWeekRange } from "@/lib/date";
import type { DailyChannelSales, MenuItemSales } from "./types";

export type Period = "daily" | "weekly" | "monthly";

export type PeriodRange = { start: string; end: string };

export type PeriodTotals = {
  gross: number;
  net: number;
  orderCount: number;
  avgSpend: number;
};

function shiftDateByYears(dateStr: string, years: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y + years, m - 1, d));
  return date.toISOString().slice(0, 10);
}

function shiftDateByDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function daysBetween(fromStr: string, toStr: string): number {
  const [fy, fm, fd] = fromStr.split("-").map(Number);
  const [ty, tm, td] = toStr.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

export function getPeriodRange(period: Period, date: string): PeriodRange {
  if (period === "daily") return { start: date, end: date };
  if (period === "weekly") return getWeekRange(date);
  const [y, m] = date.split("-").map(Number);
  return {
    start: `${y}-${String(m).padStart(2, "0")}-01`,
    end: `${y}-${String(m).padStart(2, "0")}-${String(getLastDayOfMonth(y, m)).padStart(2, "0")}`,
  };
}

// 期間を1つ前・1つ後にずらす(◀前へ/次へ▶ボタン用)
export function shiftPeriod(period: Period, date: string, direction: 1 | -1): string {
  if (period === "daily") return shiftDateByDays(date, direction);
  if (period === "weekly") return shiftDateByDays(date, 7 * direction);
  const [y, m, d] = date.split("-").map(Number);
  const newMonth = m + direction;
  const wrappedYear = y + Math.floor((newMonth - 1) / 12);
  const wrappedMonth = ((((newMonth - 1) % 12) + 12) % 12) + 1;
  return `${wrappedYear}-${String(wrappedMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// 前年同期間(同日/同週/同月)の日付範囲
export function getYearAgoRange(period: Period, date: string): PeriodRange {
  return getPeriodRange(period, shiftDateByYears(date, -1));
}

// 前週同曜日の日付範囲(日次表示の時だけ使う)
export function getWeekAgoRange(date: string): PeriodRange {
  const weekAgo = shiftDateByDays(date, -7);
  return { start: weekAgo, end: weekAgo };
}

export function filterByRange(rows: DailyChannelSales[], range: PeriodRange): DailyChannelSales[] {
  return rows.filter((r) => r.date >= range.start && r.date <= range.end);
}

export function sumTotals(rows: DailyChannelSales[]): PeriodTotals {
  const gross = rows.reduce((s, r) => s + r.gross_amount, 0);
  const net = rows.reduce((s, r) => s + r.net_amount, 0);
  const orderCount = rows.reduce((s, r) => s + r.order_count, 0);
  return { gross, net, orderCount, avgSpend: orderCount > 0 ? gross / orderCount : 0 };
}

// 前年・前週比較の増減率(%)。比較対象データがない場合はnull。
export function getChangeRate(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

// 月内の実績から、月末時点の着地予測額を単純な日割りで算出する。
// (経過日数分の平均日商 × 月の総日数)
export function getMonthEndForecast(
  monthRange: PeriodRange,
  monthGrossSoFar: number,
  today: string,
): number | null {
  if (today < monthRange.start || today > monthRange.end) return null; // 過去/未来の月は予測しない
  const daysElapsed = daysBetween(monthRange.start, today) + 1;
  const totalDays = daysBetween(monthRange.start, monthRange.end) + 1;
  if (daysElapsed <= 0) return null;
  const avgPerDay = monthGrossSoFar / daysElapsed;
  return avgPerDay * totalDays;
}

export type MenuItemSalesWithNames = MenuItemSales & {
  menu_item_name: string;
  category: string | null;
};

export type MenuItemAggregate = {
  key: string;
  name: string;
  quantity: number;
  gross: number;
  share: number;
};

export function aggregateByMenuItem(rows: MenuItemSalesWithNames[]): MenuItemAggregate[] {
  const map = new Map<string, MenuItemAggregate>();
  for (const r of rows) {
    const key = r.menu_item_id ?? r.external_name;
    const entry = map.get(key) ?? { key, name: r.menu_item_name, quantity: 0, gross: 0, share: 0 };
    entry.quantity += r.quantity;
    entry.gross += r.gross_amount;
    map.set(key, entry);
  }
  const total = [...map.values()].reduce((s, e) => s + e.gross, 0);
  return [...map.values()]
    .sort((a, b) => b.gross - a.gross)
    .map((e) => ({ ...e, share: total > 0 ? (e.gross / total) * 100 : 0 }));
}

export function aggregateByCategory(rows: MenuItemSalesWithNames[]): MenuItemAggregate[] {
  const map = new Map<string, MenuItemAggregate>();
  for (const r of rows) {
    const key = r.category ?? "未分類";
    const entry = map.get(key) ?? { key, name: key, quantity: 0, gross: 0, share: 0 };
    entry.quantity += r.quantity;
    entry.gross += r.gross_amount;
    map.set(key, entry);
  }
  const total = [...map.values()].reduce((s, e) => s + e.gross, 0);
  return [...map.values()]
    .sort((a, b) => b.gross - a.gross)
    .map((e) => ({ ...e, share: total > 0 ? (e.gross / total) * 100 : 0 }));
}
