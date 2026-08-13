import type { AssigneeType, SubtaskStatus } from "@/types/database.types";

export type Subtask = {
  id: string;
  task_id: string;
  title: string;
  status: SubtaskStatus;
  completed_at: string | null;
  due_date: string | null;
  assignee_type: AssigneeType;
  assignee_staff_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SubtaskWithRelations = Subtask & {
  assignee_name: string;
};

export type TaskProgress = {
  percent: number;
  completed: number;
  total: number;
  isOverride: boolean;
};
