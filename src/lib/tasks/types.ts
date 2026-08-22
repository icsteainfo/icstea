import type {
  AssigneeType,
  PriorityLevel,
  RecurrenceType,
  TaskSource,
  TaskStatus,
} from "@/types/database.types";
import type { SubtaskWithRelations } from "@/lib/subtasks/types";

export type Task = {
  id: string;
  title: string;
  memo: string | null;
  category_id: string | null;
  assignee_type: AssigneeType;
  assignee_staff_id: string | null;
  due_date: string | null;
  start_date: string | null;
  status: TaskStatus;
  completed_at: string | null;
  is_waiting: boolean;
  waiting_follow_up_date: string | null;
  waiting_note: string | null;
  priority_level: PriorityLevel;
  priority_score: number;
  priority_reason: string | null;
  priority_updated_at: string | null;
  recurrence_series_id: string | null;
  related_product_id: string | null;
  stores_order_id: string | null;
  progress_override: number | null;
  project_id: string | null;
  source: TaskSource;
  created_at: string;
  updated_at: string;
};

// 画面表示用に、カテゴリー名・担当者名・サブタスクを展開したもの
export type TaskWithRelations = Task & {
  category_name: string | null;
  assignee_name: string;
  project_name: string | null;
  subtasks: SubtaskWithRelations[];
};

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type Staff = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type TaskListFilters = {
  status?: TaskStatus;
  categoryId?: string;
  assigneeType?: AssigneeType;
  assigneeStaffId?: string;
  isWaiting?: boolean;
  projectId?: string;
};

// 毎週の場合: { weekday: 0-6 (0=日曜) }
// 毎月○日までの場合: { dayOfMonth: 1-31 }
// 毎日・毎月月末までの場合は追加設定なし
export type RecurrenceConfig = {
  weekday?: number;
  dayOfMonth?: number;
};

export type RecurrenceSeries = {
  id: string;
  title_template: string;
  category_id: string | null;
  assignee_type: AssigneeType;
  assignee_staff_id: string | null;
  memo_template: string | null;
  recurrence_type: RecurrenceType;
  recurrence_config: RecurrenceConfig | null;
  // Todoが生成される日(繰り返し設定で決まる日)から、何日後を期限にするか。
  // 0なら「出現日=期限」で、これまでの繰り返しTodoと同じ挙動になる。
  due_offset_days: number;
  priority_level: PriorityLevel;
  is_active: boolean;
  last_generated_due_date: string | null;
  created_at: string;
};

export type RecurrenceSeriesWithRelations = RecurrenceSeries & {
  category_name: string | null;
  assignee_name: string;
};

export type RecurrenceSeriesSubtask = {
  id: string;
  series_id: string;
  title: string;
  sort_order: number;
  created_at: string;
};

export type RecurrenceSeriesWithSubtasks = RecurrenceSeriesWithRelations & {
  subtasks: RecurrenceSeriesSubtask[];
};
