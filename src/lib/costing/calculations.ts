import type { CostLine } from "./types";

// 原材料の1g/1ml/1個あたり単価(仕入価格 ÷ 内容量)。
// どちらか未入力・内容量0の場合は「まだ計算できない」という意味でnullを返す。
export function unitCost(product: {
  purchase_price: number | null;
  package_amount: number | null;
}): number | null {
  if (
    product.purchase_price == null ||
    product.package_amount == null ||
    product.package_amount === 0
  ) {
    return null;
  }
  return product.purchase_price / product.package_amount;
}

// 材料明細(使用量×単価)の合計。単価が未確定の材料が1つでもあればnull
// (「原価がまだ計算できません」という状態を表す)。
export function sumIngredientCost(lines: CostLine[]): number | null {
  let total = 0;
  for (const line of lines) {
    if (line.unitCost == null) return null;
    total += line.amount * line.unitCost;
  }
  return total;
}

// 中間レシピ(シロップ等)の1gあたり原価 = 材料原価合計 ÷ 出来上がり量。
export function intermediateRecipeUnitCost(
  totalCost: number | null,
  yieldAmount: number,
): number | null {
  if (totalCost == null || yieldAmount <= 0) return null;
  return totalCost / yieldAmount;
}

// 原価率(%) = 原価 ÷ 販売価格 × 100
export function costRatio(
  cost: number | null,
  price: number | null,
): number | null {
  if (cost == null || price == null || price <= 0) return null;
  return (cost / price) * 100;
}

// 粗利(円) = 販売価格 − 原価。
// 人件費・家賃・決済手数料などを差し引く前の値のため「利益」ではなく「粗利」と呼ぶ。
export function grossProfit(
  price: number | null,
  cost: number | null,
): number | null {
  if (price == null || cost == null) return null;
  return price - cost;
}

// 目標原価率(%)を満たすために必要な最低販売価格。
export function requiredPriceForTargetRatio(
  cost: number | null,
  targetRatioPercent: number,
): number | null {
  if (cost == null || targetRatioPercent <= 0) return null;
  return cost / (targetRatioPercent / 100);
}

// 仕入価格がpercentChange(%)だけ変動した場合の新しい原価。
// 例: percentChange=10 なら10%値上げ後の原価。
export function costAfterPriceChange(
  cost: number | null,
  percentChange: number,
): number | null {
  if (cost == null) return null;
  return cost * (1 + percentChange / 100);
}
