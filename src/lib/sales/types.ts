import type { Channel } from "@/types/database.types";
export type { Channel };

export type ChannelSettings = {
  channel: Channel;
  display_name: string;
  commission_rate: number;
};

export type MenuItem = {
  id: string;
  name: string;
  category: string | null;
  is_active: boolean;
  sort_order: number;
  parent_menu_item_id: string | null;
  hot_ice: "HOT" | "ICE" | null;
  size: string | null;
  variant_label: string | null;
  list_price: number | null;
  recipe_category: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyChannelSales = {
  id: string;
  date: string;
  channel: Channel;
  gross_amount: number;
  net_amount: number;
  order_count: number;
};

export type MenuItemSales = {
  id: string;
  date: string;
  channel: Channel;
  menu_item_id: string | null;
  external_name: string;
  quantity: number;
  gross_amount: number;
};

export type SalesTarget = {
  id: string;
  month: string;
  target_amount: number;
};

// CSVインポーターが1回の取込結果として返す、DBに書き込む前の中間データ。
export type ImportResult = {
  dailySales: Omit<DailyChannelSales, "id">[];
  menuItemSales: Omit<MenuItemSales, "id" | "menu_item_id">[];
};
