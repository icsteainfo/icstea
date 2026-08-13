import type { TaskProgress } from "./types";

// 大項目の進捗を計算する。サブタスクが1つもなければ進捗表示自体を行わない(null)。
// 手動上書きがあればその値を優先し、なければサブタスクの完了数から自動計算する。
export function computeProgress(
  progressOverride: number | null,
  subtasks: { status: "open" | "completed" }[],
): TaskProgress | null {
  if (subtasks.length === 0) return null;

  const completed = subtasks.filter((s) => s.status === "completed").length;
  const total = subtasks.length;
  const isOverride = progressOverride !== null;
  const percent = isOverride
    ? progressOverride
    : Math.round((completed / total) * 100);

  return { percent, completed, total, isOverride };
}
