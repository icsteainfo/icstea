import type { PlLineItem } from "./types";

// 損益データの各項目を、経営サマリー用の分類(原価・人件費・固定費・その他経費)に仕分けるルール。
// 店舗の会計ソフトが出力する損益計算書の項目名を基準にしつつ、写真からのAI読み取りで生じる
// 表記ゆれ・OCR誤読(例:「従業員給与」が「保業賃給与」、「バイト」が「パイト」になる等)にも
// できるだけ耐えられるよう、完全一致に加えてキーワードを含むかどうかでも判定する。
const REVENUE_LABELS = ["売上高合計"];
const COST_LABELS = ["当月売上原価"];
const COST_KEYWORDS = ["売上原価"];
const LABOR_LABELS = ["従業員給与", "従業員賞与", "従業員給与(バイト)", "法定福利費"];
const LABOR_KEYWORDS = ["給与", "賞与", "福利費"];
const FIXED_LABELS = ["地代家賃", "管理諸費"];
const FIXED_KEYWORDS = ["家賃", "管理諸費", "管理費"];

// 「◯◯小計」「◯◯費計」「営業利益」など、他の項目を合計・差し引きして求められる行は
// 二重計上を防ぐため集計対象から除外する(売上高合計・当月売上原価は例外として個別に判定済み)
const SUBTOTAL_LABEL_PATTERN = /(小計|合計|費計|利益)$/;

function normalizeLabel(label: string): string {
  return label
    .trim()
    .replace(/[\s　]+/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")");
}

function includesNormalized(labels: string[], target: string): boolean {
  const normalizedTarget = normalizeLabel(target);
  return labels.map(normalizeLabel).includes(normalizedTarget);
}

function matchesLabelOrKeyword(label: string, exactLabels: string[], keywords: string[]): boolean {
  if (includesNormalized(exactLabels, label)) return true;
  const normalized = normalizeLabel(label);
  return keywords.some((keyword) => normalized.includes(keyword));
}

type ExpenseCategory = "cost" | "labor" | "fixed" | "other" | "excluded";

function classifyExpenseLabel(label: string): ExpenseCategory {
  if (matchesLabelOrKeyword(label, COST_LABELS, COST_KEYWORDS)) return "cost";

  // 小計・合計・利益の行は、個別項目との二重計上を避けるため、費目別のキーワード判定より先に除外する
  if (SUBTOTAL_LABEL_PATTERN.test(label.trim())) return "excluded";

  if (matchesLabelOrKeyword(label, LABOR_LABELS, LABOR_KEYWORDS)) return "labor";
  if (matchesLabelOrKeyword(label, FIXED_LABELS, FIXED_KEYWORDS)) return "fixed";
  return "other";
}

export type ManagementSummary = {
  revenue: number;
  cost: number;
  labor: number;
  fixed: number;
  other: number;
  profit: number;
  costRate: number | null;
  laborRate: number | null;
  fixedRate: number | null;
  otherRate: number | null;
  profitRate: number | null;
  // 参考指標: 原価率+人件費率(飲食店等でよく使われる、売上に対する変動費比率の目安)
  flRate: number | null;
  // 小計・合計行として集計対象から除外した項目名(集計の透明性のため保持)
  excludedLabels: string[];
  // 損益表に印字されている利益(経常利益・営業利益など)。検算用で、集計には含めない
  referenceProfitLabel: string | null;
  referenceProfitAmount: number | null;
  // 分類後の利益 - 損益表記載の利益。0に近いほど分類が正しいことの目安になる
  profitDiscrepancy: number | null;
};

function rateOf(value: number, revenue: number): number | null {
  if (revenue === 0) return null;
  return (value / revenue) * 100;
}

export function computeManagementSummary(lineItems: PlLineItem[]): ManagementSummary {
  const revenue = lineItems
    .filter(
      (item) =>
        item.type === "revenue" ||
        includesNormalized(REVENUE_LABELS, item.label) ||
        (normalizeLabel(item.label).includes("売上高") && normalizeLabel(item.label).includes("合計")),
    )
    .reduce((sum, item) => sum + item.amount, 0);

  let cost = 0;
  let labor = 0;
  let fixed = 0;
  let other = 0;
  const excludedLabels: string[] = [];

  for (const item of lineItems) {
    if (item.type !== "expense") continue;
    const category = classifyExpenseLabel(item.label);
    if (category === "cost") cost += item.amount;
    else if (category === "labor") labor += item.amount;
    else if (category === "fixed") fixed += item.amount;
    else if (category === "other") other += item.amount;
    else excludedLabels.push(item.label);
  }

  const profit = revenue - cost - labor - fixed - other;
  const costRate = rateOf(cost, revenue);
  const laborRate = rateOf(labor, revenue);
  const fixedRate = rateOf(fixed, revenue);
  const otherRate = rateOf(other, revenue);
  const profitRate = rateOf(profit, revenue);
  const flRate = costRate !== null && laborRate !== null ? costRate + laborRate : null;

  const referenceItem = lineItems.find((item) => item.type === "reference") ?? null;
  const referenceProfitLabel = referenceItem?.label ?? null;
  const referenceProfitAmount = referenceItem?.amount ?? null;
  const profitDiscrepancy =
    referenceProfitAmount === null ? null : profit - referenceProfitAmount;

  return {
    revenue,
    cost,
    labor,
    fixed,
    other,
    profit,
    costRate,
    laborRate,
    fixedRate,
    otherRate,
    profitRate,
    flRate,
    excludedLabels,
    referenceProfitLabel,
    referenceProfitAmount,
    profitDiscrepancy,
  };
}
