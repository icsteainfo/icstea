import { createClient } from "@/lib/supabase/server";
import { listTasks } from "@/lib/tasks/queries";
import { listProjects } from "@/lib/projects/queries";
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
import { ActiveProjectsSection } from "@/components/home/active-projects-section";
import { InventoryAlertSection } from "@/components/home/inventory-alert-section";
import { InventoryCheckAlertSection } from "@/components/home/inventory-check-alert-section";
import { NewTaskMenuButton } from "@/components/tasks/new-task-menu-button";
import { QuickMemoSection } from "@/components/home/quick-memo-section";
import {
  StarMotif,
  HeartMotif,
  SparkleMotif,
  CloudMotif,
  RainbowMotif,
} from "@/components/home/motifs";
import { generateDueRecurringInstances } from "@/lib/tasks/recurrence";
import {
  listLatestInventoryCheckAlerts,
  listProductsWithLatestStock,
} from "@/lib/inventory/queries";
import { getQuickMemo } from "@/lib/quick-memo/queries";

export default async function HomePage() {
  const supabase = await createClient();
  // Vercel Cronが万一失敗していても、ホームを開くたびに繰り返しタスクの生成漏れを自動で補う
  await generateDueRecurringInstances(supabase);
  const today = getTodayDateString();

  const [tasks, products, inventoryCheckAlerts, activeProjects, quickMemo] = await Promise.all([
    listTasks(supabase, {}),
    listProductsWithLatestStock(supabase),
    listLatestInventoryCheckAlerts(supabase),
    listProjects(supabase, { excludePhases: ["completed", "on_hold"] }),
    getQuickMemo(supabase),
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
    <div className="relative isolate -mx-4 -my-6 space-y-8 bg-background px-4 py-6">
      {/* 装飾: ページ上部に控えめな虹のアーチ */}
      <RainbowMotif
        aria-hidden
        className="pop-motif top-0 left-1/2 hidden h-20 w-72 -translate-x-1/2 -translate-y-6 opacity-80 sm:block"
      />

      <div className="relative flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <StarMotif className="pop-twinkle size-6 text-[#FF8FBC]" />
          ホーム
          <SparkleMotif className="pop-twinkle size-4 text-[#CDB7F6]" />
        </h1>
        <NewTaskMenuButton />
      </div>

      <QuickMemoSection initialContent={quickMemo} />

      <UrgentSection items={urgentItems} />
      <ActiveProjectsSection projects={activeProjects} />
      <InventoryCheckAlertSection alerts={inventoryCheckAlerts} />
      <InventoryAlertSection products={products} />
      <DelegatedSection tasks={delegatedTasks} />
      <WaitingSection tasks={waitingTasks} />
      <OtherTasksSection title="今週" tasks={weekTasks} />
      <OtherTasksSection title="今月" tasks={monthTasks} />
      <OtherTasksSection title="期限未定" tasks={undatedTasks} />
      <OtherTasksSection title="完了済み" tasks={completedTasks} />

      {/* 装飾: 余白にそっと添えるハートと雲 */}
      <HeartMotif
        aria-hidden
        className="pop-motif top-24 right-0 hidden size-8 text-[#FFD2E3] opacity-70 xl:block"
      />
      <CloudMotif
        aria-hidden
        className="pop-motif bottom-10 left-0 hidden size-14 text-[#E4F6FD] opacity-90 xl:block"
      />
    </div>
  );
}
