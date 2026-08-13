export type TaskTemplate = {
  id: string;
  name: string;
  category_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TaskTemplateWithRelations = TaskTemplate & {
  category_name: string | null;
};

export type TaskTemplateSubtask = {
  id: string;
  template_id: string;
  title: string;
  sort_order: number;
  created_at: string;
};

export type TaskTemplateWithSubtasks = TaskTemplateWithRelations & {
  subtasks: TaskTemplateSubtask[];
};
