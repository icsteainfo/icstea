import { createClient } from "@/lib/supabase/server";
import { listTasks } from "@/lib/tasks/queries";
import { listInitiatives } from "@/lib/initiatives/queries";
import {
  bucketOtherTasks,
  getTodayDateString,
  groupTasksByDueDate,
  sortTasksFallback,
} from "@/lib/tasks/classify";
import { TaskTimelineSection } from "@/components/home/task-timeline-section";
import { OtherTasksSection } from "@/components/home/other-tasks-section";
import { InitiativesSection } from "@/components/home/initiatives-section";
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
import { getQuickMemo } from "@/lib/quick-memo/queries";

export default async function HomePage() {
  const supabase = await createClient();
  // Vercel Cronが万一失敗していても、ホームを開くたびに繰り返しタスクの生成漏れを自動で補う
  await generateDueRecurringInstances(supabase);
  const today = getTodayDateString();

  const [tasks, quickMemo, activeInitiatives, archivedInitiatives] =
    await Promise.all([
      listTasks(supabase, {}),
      getQuickMemo(supabase),
      listInitiatives(supabase, { archived: false }),
      listInitiatives(supabase, { archived: true }),
    ]);

  // 取り組みに紐づくタスクは各カード内の「関連タスク」にのみ表示し、
  // ホーム下部のTodo一覧では重複させないよう除外する
  const standaloneTasks = tasks.filter((task) => !task.initiative_id);

  const dateGroups = groupTasksByDueDate(standaloneTasks, today);
  const undatedTasks = sortTasksFallback(bucketOtherTasks(standaloneTasks, "undated"), today);
  const completedTasks = bucketOtherTasks(standaloneTasks, "completed");

  return (
    <div className="relative isolate -mx-4 -my-6 space-y-4 bg-background px-4 py-6">
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

      <InitiativesSection
        initialInitiatives={activeInitiatives}
        initialArchived={archivedInitiatives}
      />

      <TaskTimelineSection groups={dateGroups} />
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
