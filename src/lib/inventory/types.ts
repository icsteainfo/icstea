export const PRODUCT_CATEGORIES = [
  "茶葉",
  "カップ",
  "缶",
  "ギフト資材",
  "包装資材",
  "食材",
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

export type StockSnapshot = {
  id: string;
  product_id: string;
  recorded_on: string;
  quantity: number;
  kitchen_back: number | null;
  under_chair: number | null;
  office: number | null;
  warehouse: number | null;
  created_at: string;
};

export type ProductWithStock = Product & {
  latest_snapshot: StockSnapshot | null;
  previous_snapshot: StockSnapshot | null;
};

// Googleスプレッドシート「在庫_ネット確認」タブで×判定になった商品の記録。
// 1回の同期(=1つのchecked_on)ごとに、その時点で×だった商品だけを保存する。
export type InventoryCheckResult = {
  id: string;
  checked_on: string;
  product_id: string;
  product_name: string;
  required_text: string | null;
  current_text: string | null;
  shortage: number | null;
  task_id: string | null;
  created_at: string;
};

export type InventoryCheckAlert = InventoryCheckResult & {
  task_status: "open" | "completed" | null;
};
