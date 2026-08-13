export function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

export function formatPercent(rate: number | null): string {
  if (rate === null) return "比較データなし";
  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate.toFixed(1)}%`;
}
