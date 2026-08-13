import { createClient } from "@/lib/supabase/server";
import { listCampaigns } from "@/lib/marketing/queries";
import { getCampaignImpact } from "@/lib/marketing/analysis";
import {
  listDailyChannelSales,
  listMenuItems,
  listMenuItemSalesWithNames,
} from "@/lib/sales/queries";
import { addDays } from "@/lib/date";
import { CampaignForm } from "@/components/marketing/campaign-form";
import { CampaignList } from "@/components/marketing/campaign-list";
import { CampaignWindowSelect } from "@/components/marketing/campaign-window-select";
import type { DailyChannelSales, MenuItemSales } from "@/lib/sales/types";

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const params = await searchParams;
  const windowDays = [7, 14, 30].includes(Number(params.window)) ? Number(params.window) : 7;

  const supabase = await createClient();
  const [campaigns, menuItems] = await Promise.all([
    listCampaigns(supabase),
    listMenuItems(supabase),
  ]);

  let dailyChannelSales: DailyChannelSales[] = [];
  let menuItemSalesRows: MenuItemSales[] = [];

  if (campaigns.length > 0) {
    const dates = campaigns.map((c) => c.date).sort();
    const from = addDays(dates[0], -windowDays);
    const to = addDays(dates[dates.length - 1], windowDays);

    [dailyChannelSales, menuItemSalesRows] = await Promise.all([
      listDailyChannelSales(supabase, { from, to }),
      listMenuItemSalesWithNames(supabase, { from, to }),
    ]);
  }

  const entries = campaigns.map((campaign) => {
    const menuItemSalesForProduct = campaign.menu_item_id
      ? menuItemSalesRows.filter((r) => r.menu_item_id === campaign.menu_item_id)
      : [];
    const impact = getCampaignImpact(
      campaign,
      windowDays,
      menuItemSalesForProduct,
      dailyChannelSales,
    );
    return { campaign, impact };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">マーケティング</h1>
        <p className="text-sm text-muted-foreground">
          SNS投稿・広告・POP掲示などの施策を記録し、実施前後の売上・販売数の変化を確認できます。
        </p>
      </div>

      <CampaignForm menuItems={menuItems} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">施策一覧</h2>
        <CampaignWindowSelect windowDays={windowDays} />
      </div>

      <CampaignList entries={entries} />
    </div>
  );
}
