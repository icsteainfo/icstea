// ガントチャート(ロードマップ)の日付計算まわりの純粋関数群。
// 「日単位で細かく見る」よりも「今月/来月に何が動いているか」を優先するため、
// 表示は常に月単位のグリッドで、バーの位置だけ日精度で計算する。

// ラベル列(プロジェクト名+フェーズバッジ)の幅。ヘッダー・グリッド線・行のバー位置計算を
// すべて揃えるための共通値(Tailwindの w-64 = 16rem と一致させること)。
export const GANTT_LABEL_COL_REM = 16;

export type GanttRange = "month" | "quarter" | "half_year" | "year";

export const GANTT_RANGE_MONTHS: Record<GanttRange, number> = {
  month: 1,
  quarter: 3,
  half_year: 6,
  year: 12,
};

export const GANTT_RANGE_LABELS: Record<GanttRange, string> = {
  month: "月",
  quarter: "3ヶ月",
  half_year: "6ヶ月",
  year: "年",
};

export type MonthBucket = { year: number; month: number };

function toMonthStart(dateStr: string): MonthBucket {
  const [y, m] = dateStr.split("-").map(Number);
  return { year: y, month: m };
}

function monthBucketToDate({ year, month }: MonthBucket): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

function addMonths(bucket: MonthBucket, count: number): MonthBucket {
  const total = bucket.year * 12 + (bucket.month - 1) + count;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

// anchorDateの月を起点に、range分の月バケットを返す
export function getVisibleMonths(anchorDate: string, range: GanttRange): MonthBucket[] {
  const start = toMonthStart(anchorDate);
  const count = GANTT_RANGE_MONTHS[range];
  return Array.from({ length: count }, (_, i) => addMonths(start, i));
}

// 前へ/次へ移動(表示中の月数ぶんまとめて移動する)
export function shiftAnchor(anchorDate: string, range: GanttRange, direction: 1 | -1): string {
  const bucket = toMonthStart(anchorDate);
  const moved = addMonths(bucket, GANTT_RANGE_MONTHS[range] * direction);
  return `${moved.year}-${String(moved.month).padStart(2, "0")}-01`;
}

export function monthLabel(bucket: MonthBucket): string {
  return `${bucket.month}月`;
}

export function yearLabelIfNeeded(bucket: MonthBucket, prev: MonthBucket | undefined): string | null {
  if (!prev || prev.year !== bucket.year) return `${bucket.year}年`;
  return null;
}

// 表示範囲の[開始, 終了)を日単位のDateで返す
export function getWindowRange(anchorDate: string, range: GanttRange): { start: Date; end: Date } {
  const months = getVisibleMonths(anchorDate, range);
  const start = monthBucketToDate(months[0]);
  const end = monthBucketToDate(addMonths(months[months.length - 1], 1));
  return { start, end };
}

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export type ProjectSpan = {
  startDate: string | null;
  dueDate: string | null;
  endDate: string | null;
};

// プロジェクトの期間(開始日 〜 終了日/目標日)を表示ウィンドウに対する left%/width% に変換する。
// 開始日・終了日のどちらも無ければnull(=「日程未定」リストに回す)。
// 開始日はあるが終了日が無い場合は、表示ウィンドウの右端まで続く(進行中)扱いにする。
export function computeBarPosition(
  span: ProjectSpan,
  window: { start: Date; end: Date },
): { leftPercent: number; widthPercent: number; ongoing: boolean } | null {
  const effectiveEnd = span.endDate ?? span.dueDate;
  if (!span.startDate && !effectiveEnd) return null;

  const totalDays = daysBetween(window.start, window.end);
  if (totalDays <= 0) return null;

  const barStart = span.startDate ? new Date(`${span.startDate}T00:00:00Z`) : window.start;
  const ongoing = !!span.startDate && !effectiveEnd;
  const barEndRaw = effectiveEnd ? new Date(`${effectiveEnd}T00:00:00Z`) : window.end;
  // 単発日(開始=終了)でも視認できるよう、最低半日ぶんの幅を確保する
  const barEnd = barEndRaw.getTime() <= barStart.getTime()
    ? new Date(barStart.getTime() + 1000 * 60 * 60 * 12)
    : barEndRaw;

  if (barEnd.getTime() <= window.start.getTime() || barStart.getTime() >= window.end.getTime()) {
    return null;
  }

  const clippedStart = clamp(daysBetween(window.start, barStart), 0, totalDays);
  const clippedEnd = clamp(daysBetween(window.start, barEnd), 0, totalDays);

  return {
    leftPercent: (clippedStart / totalDays) * 100,
    widthPercent: Math.max(((clippedEnd - clippedStart) / totalDays) * 100, 0.5),
    ongoing,
  };
}

// ラベル列を除いたチャート領域内でのfraction(0〜1)から、outerラッパー基準のleft値(calc式)を作る
export function ganttOverlayLeft(fraction: number): string {
  return `calc(${GANTT_LABEL_COL_REM}rem + (100% - ${GANTT_LABEL_COL_REM}rem) * ${fraction})`;
}

// 今日の縦線の位置(表示ウィンドウ外ならnull)
export function computeTodayPercent(
  todayDateStr: string,
  window: { start: Date; end: Date },
): number | null {
  const totalDays = daysBetween(window.start, window.end);
  if (totalDays <= 0) return null;
  const today = new Date(`${todayDateStr}T00:00:00Z`);
  if (today.getTime() < window.start.getTime() || today.getTime() > window.end.getTime()) {
    return null;
  }
  return (daysBetween(window.start, today) / totalDays) * 100;
}
