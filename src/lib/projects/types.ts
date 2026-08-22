import type { ProjectNoteType, ProjectPhase } from "@/types/database.types";
import type { TaskWithRelations } from "@/lib/tasks/types";

export type Project = {
  id: string;
  name: string;
  category_id: string | null;
  purpose: string | null;
  memo: string | null;
  phase: ProjectPhase;
  start_date: string | null;
  due_date: string | null;
  end_date: string | null;
  final_review: string | null;
  created_at: string;
  updated_at: string;
};

// 関連図(看護記録の関連図のような、要因同士を矢印でつなぐ図)の1件分
export type ProjectDiagramNode = {
  id: string;
  text: string;
  x: number;
  y: number;
};

export type ProjectDiagramEdge = {
  id: string;
  source: string;
  target: string;
  label: string | null;
};

export type ProjectDiagram = {
  nodes: ProjectDiagramNode[];
  edges: ProjectDiagramEdge[];
};

// 随時追加できる経過感想の1件。テキストか関連図のどちらかを持つ(スナップショットとして都度追加し、後から編集はしない)
export type ProjectNote = {
  id: string;
  project_id: string;
  note_type: ProjectNoteType;
  content: string | null;
  diagram: ProjectDiagram | null;
  created_at: string;
};

// カテゴリ名を展開した、一覧・ガントチャート・ホームカードで使う表示用の形
export type ProjectSummary = Project & {
  category_name: string | null;
  tasks: TaskWithRelations[];
};

export type ProjectWithTasks = Project & {
  category_name: string | null;
  tasks: TaskWithRelations[];
  notes: ProjectNote[];
};

export type ProjectListFilters = {
  phase?: ProjectPhase;
  excludePhases?: ProjectPhase[];
};
