// revenue/expenseは金額を絶対値で持ち、符号はtypeで表す(集計しやすくするため)。
// referenceは損益表に印字されている利益(経常利益など)を検算用にそのまま転記したもので、
// 符号付きの金額を持ち、経営サマリーの集計(原価・人件費・固定費・その他経費・利益)には含めない。
export type PlLineItemType = "revenue" | "expense" | "reference";

export type PlLineItem = {
  label: string;
  amount: number;
  type: PlLineItemType;
};

export type ManagementPlanActionItem = {
  title: string;
  detail: string;
};

export type ManagementPlan = {
  currentSituation: string;
  keyIssues: string[];
  actionItems: ManagementPlanActionItem[];
};

export type MonthlyReview = {
  id: string;
  month: string;
  pl_image_storage_path: string | null;
  pl_image_file_name: string | null;
  pl_line_items: PlLineItem[];
  meeting_notes: string | null;
  ai_plan: ManagementPlan | null;
  ai_plan_generated_at: string | null;
  created_at: string;
  updated_at: string;
};
