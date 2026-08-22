import type { HomeSectionTint } from "@/components/home/section";

// カテゴリー名からタグの色を決める。よくある業務カテゴリーはそれらしい色に固定し、
// それ以外の自由なカテゴリー名は名前から一定の色に振り分けて毎回同じ色になるようにする。
const KEYWORD_TINT: Array<[RegExp, HomeSectionTint]> = [
  [/在庫|発注/, "green"],
  [/新商品|商品開発/, "pink"],
  [/SNS|マーケ/, "lavender"],
  [/経理|会計/, "blue"],
  [/人材|スタッフ|採用/, "yellow"],
];

const FALLBACK_TINTS: HomeSectionTint[] = ["pink", "blue", "yellow", "lavender", "green"];

export function getCategoryTint(name: string): HomeSectionTint {
  for (const [pattern, tint] of KEYWORD_TINT) {
    if (pattern.test(name)) return tint;
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_TINTS[hash % FALLBACK_TINTS.length];
}
