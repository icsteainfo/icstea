import type { InitiativePriority } from "@/types/database.types";

export const INITIATIVE_PRIORITY_LABELS: Record<InitiativePriority, string> = {
  A: "A：重要かつ緊急",
  B: "B：重要だが緊急ではない",
  C: "C：緊急だが重要度は低い",
  D: "D：重要でも緊急でもない",
};

// 一覧の基本順序: A → B → C → D
export const INITIATIVE_PRIORITY_ORDER: InitiativePriority[] = ["A", "B", "C", "D"];

// カード上の優先度セレクトの色付けにも使う
export const INITIATIVE_PRIORITY_CLASSNAME: Record<InitiativePriority, string> = {
  A: "border-transparent bg-destructive text-white",
  B: "border-transparent bg-primary text-primary-foreground",
  C: "border-transparent bg-tint-yellow text-foreground",
  D: "border-transparent bg-tint-blue text-foreground",
};
