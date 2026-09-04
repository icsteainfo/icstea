// 商品の分類。以前は「在庫管理用(category)」「原材料・資材一覧用(material_category)」で
// 別々の値を使っていたが、商品追加・編集画面では1つのカテゴリー選択にまとめ、
// 選んだ値を両方の列に同時保存する(新規登録・編集のたびに自然と揃っていく)。
export const PRODUCT_CATEGORIES = [
  "茶葉",
  "カップ・蓋・ストロー",
  "ミルク・割りもの",
  "トッピング",
  "ギフト資材",
  "包装資材",
  "その他店舗備品",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  lead_time_days: number;
  safety_stock: number;
  safety_stock_days: number;
  last_ordered_at: string | null;
  last_received_at: string | null;
  is_active: boolean;
  sort_order: number;
  supplier: string | null;
  purchase_price: number | null;
  package_amount: number | null;
  price_updated_at: string | null;
  note: string | null;
  display_color: string | null;
  material_category: string | null;
  material_sort_order: number;
  show_in_costing: boolean;
  merged_into_product_id: string | null;
  created_at: string;
  updated_at: string;
};

// カテゴリー統一前の名称の違いを吸収するための対応表(DBの値そのものは書き換えない)。
// 「トッピング・その他」は統一後「トッピング」という名称になったため、ここでだけ読み替える。
const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  "トッピング・その他": "トッピング",
};

// 「実質カテゴリー」。material_categoryが設定されていればそちら(より細かい分類)を優先し、
// 無ければ在庫管理用のcategoryを使う。新規登録・編集後は両方の値が一致するため、
// この関数は主に、統合前の古いデータ(2つの列が食い違っている商品)を破綻なく表示するために使う。
export function effectiveMaterialCategory(product: Pick<Product, "category" | "material_category">): string {
  const raw = product.material_category || product.category;
  return LEGACY_CATEGORY_ALIASES[raw] ?? raw;
}
