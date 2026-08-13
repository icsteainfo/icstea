// 数値を「1,000」のようにカンマ区切りで表示するための共通ヘルパー
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("ja-JP");
}
