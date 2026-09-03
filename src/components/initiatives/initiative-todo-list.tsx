"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { TaskRowCompact } from "@/components/tasks/task-row-compact";
import type { TaskWithRelations } from "@/lib/tasks/types";

// 取り組みカード内で「関連タスク N件」をクリックすると展開する一覧。
// 完了チェック・編集・複製・削除は既存のTaskListItem(=tasksテーブルの同じデータ)をそのまま再利用する。
// 進捗管理が目的ではないため、進捗率やバーはあえて表示しない。
export function InitiativeTodoList({ tasks }: { tasks: TaskWithRelations[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
      >
        {open ? (
          <ChevronDownIcon className="size-3.5" />
        ) : (
          <ChevronRightIcon className="size-3.5" />
        )}
        関連タスク {tasks.length}件
      </button>
      {open && (
        <div className="pt-1">
          {tasks.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              関連タスクはまだありません
            </p>
          ) : (
            tasks.map((task) => <TaskRowCompact key={task.id} task={task} />)
          )}
        </div>
      )}
    </div>
  );
}
