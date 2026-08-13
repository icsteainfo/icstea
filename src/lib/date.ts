// YYYY-MM-DD形式の日付文字列を扱う共通ユーティリティ(日本時間基準)

export function getTodayDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    now,
  );
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function getWeekday(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=日曜
}

export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function makeDateString(year: number, month: number, day: number): string {
  const lastDay = getLastDayOfMonth(year, month);
  const clampedDay = Math.min(day, lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
}

// 月曜始まりの週の範囲(dateを含む週の月曜〜日曜)
export function getWeekRange(dateStr: string): { start: string; end: string } {
  const dayOfWeek = getWeekday(dateStr);
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return {
    start: addDays(dateStr, diffToMonday),
    end: addDays(dateStr, diffToMonday + 6),
  };
}

export function getMonthRange(dateStr: string): { start: string; end: string } {
  const [y, m] = dateStr.split("-").map(Number);
  return {
    start: makeDateString(y, m, 1),
    end: makeDateString(y, m, getLastDayOfMonth(y, m)),
  };
}
