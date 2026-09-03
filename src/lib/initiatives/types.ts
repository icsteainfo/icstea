import type { InitiativeStatus } from "@/types/database.types";
import type { TaskWithRelations } from "@/lib/tasks/types";

export type Initiative = {
  id: string;
  title: string;
  status: InitiativeStatus;
  next_action: string | null;
  memo: string | null;
  due_date: string | null;
  archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// ホームカードで使う、関連Todoを展開した形
export type InitiativeWithTasks = Initiative & {
  tasks: TaskWithRelations[];
};

export type InitiativeListFilters = {
  archived?: boolean;
};
