import type { Product } from "./types";

export type DuplicateCandidatePair = {
  key: string;
  curated: Product;
  uncurated: Product;
};

function normalize(name: string): string {
  return name
    .replace(/[\s　]+/g, "")
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .toLowerCase();
}

// サイズ・容量表記(oz/ml/mm/cc/g/kg/l)やカッコ書きを取り除いた「基本名」で比較するための正規化。
function stripSizeSuffix(name: string): string {
  return name
    .replace(/\d+(oz|ml|mm|cc|kg|g|l)\b/gi, "")
    .replace(/[（(].*?[）)]/g, "")
    .trim();
}

// 「未整理(スプレッドシート取込のまま、カテゴリー・仕入価格が未設定)」かどうか。
// 重複候補は、名前が似ているだけでなく、この状態の差(整理済み側と未整理側)がある場合に絞る。
// 名前が似ているだけの別材料(例: 「レモン」と「はちみつレモン」)は、
// どちらも整理済みであれば重複候補から除外できる。
function isUncurated(product: Product): boolean {
  return !product.material_category && product.purchase_price == null;
}

// 商品名の類似度(包含関係、またはサイズ表記を除いた基本名の一致)と、
// 片方だけが未整理という条件で、重複の可能性がある商品ペアを検出する(純粋関数・DB書き込みなし)。
export function findDuplicateCandidates(products: Product[]): DuplicateCandidatePair[] {
  const list = products.map((p) => ({
    product: p,
    norm: normalize(p.name),
    base: normalize(stripSizeSuffix(p.name)),
  }));

  const pairs: DuplicateCandidatePair[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const a = list[i];
      const b = list[j];
      if (a.norm === b.norm) continue;

      const nameRelated =
        a.norm.includes(b.norm) || b.norm.includes(a.norm) || (a.base.length >= 2 && a.base === b.base);
      if (!nameRelated) continue;

      const aUncurated = isUncurated(a.product);
      const bUncurated = isUncurated(b.product);
      if (aUncurated === bUncurated) continue; // 両方整理済み or 両方未整理は対象外

      const key = [a.product.id, b.product.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);

      pairs.push({
        key,
        curated: aUncurated ? b.product : a.product,
        uncurated: aUncurated ? a.product : b.product,
      });
    }
  }

  return pairs;
}
