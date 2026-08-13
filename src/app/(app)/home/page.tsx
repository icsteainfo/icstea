import { createClient } from "@/lib/supabase/server";
import { listTasks } from "@/lib/tasks/queries";
import {
  bucketOtherTasks,
  buildTodayItems,
  getTodayDateString,
  isDelegated,
  isWaitingTask,
  sortTasksFallback,
} from "@/lib/tasks/classify";
import { UrgentSection } from "@/components/home/urgent-section";
import { DelegatedSection } from "@/components/home/delegated-section";
import { WaitingSection } from "@/components/home/waiting-section";
import { OtherTasksSection } from "@/components/home/other-tasks-section";
import { InventoryAlertSection } from "@/components/home/inventory-alert-section";
import { InventoryCheckAlertSection } from "@/components/home/inventory-check-alert-section";
import { NewTaskMenuButton } from "@/components/tasks/new-task-menu-button";
import { generateDueRecurringInstances } from "@/lib/tasks/recurrence";
import {
  listLatestInventoryCheckAlerts,
  listProductsWithLatestStock,
} from "@/lib/inventory/queries";

export default async function HomePage() {
  const supabase = await createClient();
  // Vercel Cronが万一失敗していても、ホームを開くたびに繰り返しタスクの生成漏れを自動で補う
  await generateDueRecurringInstances(supabase);
  const today = getTodayDateString();

  const [tasks, products, inventoryCheckAlerts] = await Promise.all([
    listTasks(supabase, {}),
    listProductsWithLatestStock(supabase),
    listLatestInventoryCheckAlerts(supabase),
  ]);

  const urgentItems = buildTodayItems(tasks, today);
  const delegatedTasks = sortTasksFallback(tasks.filter(isDelegated), today);
  const waitingTasks = [...tasks.filter(isWaitingTask)].sort((a, b) => {
    const af = a.waiting_follow_up_date ?? "9999-99-99";
    const bf = b.waiting_follow_up_date ?? "9999-99-99";
    return af < bf ? -1 : af > bf ? 1 : 0;
  });

  const weekTasks = sortTasksFallback(bucketOtherTasks(tasks, "week", today), today);
  const monthTasks = sortTasksFallback(bucketOtherTasks(tasks, "month", today), today);
  const undatedTasks = sortTasksFallback(bucketOtherTasks(tasks, "undated", today), today);
  const completedTasks = bucketOtherTasks(tasks, "completed", today);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ホーム</h1>
        <NewTaskMenuButton />
      </div>
      <UrgentSection items={urgentItems} />
      <InventoryCheckAlertSection alerts={inventoryCheckAlerts} />
      <InventoryAlertSection products={products} />
      <DelegatedSection tasks={delegatedTasks} />
      <WaitingSection tasks={waitingTasks} />
      <OtherTasksSection title="今週" tasks={weekTasks} />
      <OtherTasksSection title="今月" tasks={monthTasks} />
      <OtherTasksSection title="期限未定" tasks={undatedTasks} />
      <OtherTasksSection title="完了済み" tasks={completedTasks} />
    </div>
  );
}
