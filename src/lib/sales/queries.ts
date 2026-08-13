import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  Channel,
  ChannelSettings,
  DailyChannelSales,
  MenuItem,
  MenuItemSales,
  SalesTarget,
} from "./types";

type Client = SupabaseClient<Database>;

export async function listChannelSettings(supabase: Client): Promise<ChannelSettings[]> {
  const { data, error } = await supabase.from("channel_settings").select("*");
  if (error) throw error;
  return data;
}

export async function listMenuItems(supabase: Client): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data;
}

export async function upsertDailyChannelSales(
  supabase: Client,
  rows: Omit<DailyChannelSales, "id">[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("daily_channel_sales")
    .upsert(rows, { onConflict: "date,channel" });
  if (error) throw error;
}

// 商品別の販売実績を取り込む。渡された商品名(external_name)がまだmenu_itemsに
// 対応付けられていない場合は、その場でmenu_itemsとマッピングを自動作成する
// (毎回の取込前に商品一覧を手動整備してもらう必要をなくすため)。
export async function upsertMenuItemSales(
  supabase: Client,
  channel: Channel,
  rows: Omit<MenuItemSales, "id" | "menu_item_id">[],
  categoriesByName?: Map<string, string>,
): Promise<void> {
  if (rows.length === 0) return;

  const { data: existingMappings, error: mappingError } = await supabase
    .from("channel_menu_item_mappings")
    .select("external_name, menu_item_id")
    .eq("channel", channel);
  if (mappingError) throw mappingError;

  const mappingByName = new Map(
    (existingMappings ?? []).map((m) => [m.external_name, m.menu_item_id]),
  );

  const unmappedNames = [...new Set(rows.map((r) => r.external_name))].filter(
    (name) => !mappingByName.has(name),
  );

  for (const name of unmappedNames) {
    const { data: menuItem, error: menuItemError } = await supabase
      .from("menu_items")
      .insert({ name, category: categoriesByName?.get(name) ?? null })
      .select("id")
      .single();
    if (menuItemError) throw menuItemError;

    const { error: mapError } = await supabase
      .from("channel_menu_item_mappings")
      .insert({ channel, external_name: name, menu_item_id: menuItem.id });
    if (mapError) throw mapError;

    mappingByName.set(name, menuItem.id);
  }

  const withMenuItemId = rows.map((r) => ({
    ...r,
    menu_item_id: mappingByName.get(r.external_name) ?? null,
  }));

  const { error } = await supabase
    .from("menu_item_sales")
    .upsert(withMenuItemId, { onConflict: "date,channel,external_name" });
  if (error) throw error;
}

export async function listDailyChannelSales(
  supabase: Client,
  range: { from: string; to: string },
): Promise<DailyChannelSales[]> {
  const { data, error } = await supabase
    .from("daily_channel_sales")
    .select("*")
    .gte("date", range.from)
    .lte("date", range.to)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

type MenuItemSalesRow = MenuItemSales & {
  menu_items: { name: string; category: string | null } | null;
};

export async function listMenuItemSalesWithNames(
  supabase: Client,
  range: { from: string; to: string },
): Promise<import("./analysis").MenuItemSalesWithNames[]> {
  const { data, error } = await supabase
    .from("menu_item_sales")
    .select("*, menu_items(name, category)")
    .gte("date", range.from)
    .lte("date", range.to);
  if (error) throw error;

  return (data as unknown as MenuItemSalesRow[]).map((row) => {
    const { menu_items, ...rest } = row;
    return {
      ...rest,
      menu_item_name: menu_items?.name ?? rest.external_name,
      category: menu_items?.category ?? null,
    };
  });
}

export async function getSalesTarget(
  supabase: Client,
  month: string,
): Promise<SalesTarget | null> {
  const { data, error } = await supabase
    .from("sales_targets")
    .select("*")
    .eq("month", month)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function setSalesTarget(
  supabase: Client,
  month: string,
  targetAmount: number,
): Promise<void> {
  const { error } = await supabase
    .from("sales_targets")
    .upsert({ month, target_amount: targetAmount }, { onConflict: "month" });
  if (error) throw error;
}
