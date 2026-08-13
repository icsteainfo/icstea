import { createClient } from "@/lib/supabase/server";
import { computeMenuItemCost, loadCostingData } from "@/lib/costing/queries";
import { CostAnalysisSimulator } from "@/components/costing/cost-analysis-simulator";

export default async function CostAnalysisPage() {
  const supabase = await createClient();
  const data = await loadCostingData(supabase);

  const items = data.menuItems
    .filter((item) => data.menuItemIngredientsByMenuItem.has(item.id))
    .map((item) => ({
      id: item.id,
      name: item.name,
      cost: computeMenuItemCost(item.id, data),
      listPrice: item.list_price,
    }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        「販売価格を変えたら?」「原価率25%にするには?」「仕入価格が上がったら?」を計算だけで試算します(AIは使用しません)。
      </p>
      <CostAnalysisSimulator items={items} />
    </div>
  );
}
