import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectPhase } from "@/types/database.types";

export const PROJECT_PHASE_LABELS: Record<ProjectPhase, string> = {
  concept: "構想",
  researching: "調査中",
  preparing: "準備中",
  active: "実行中",
  operating: "運用中",
  on_hold: "保留",
  completed: "完了",
};

// 今アクティブなフェーズほど目立つように、既存のティントカラーで濃淡をつける。
// 保留・完了はあえて淡く後退させ、「今動いているもの」に目が行くようにする。
const PROJECT_PHASE_CLASSNAME: Record<ProjectPhase, string> = {
  concept: "border-dashed border-border bg-transparent text-muted-foreground",
  researching: "border-transparent bg-tint-blue text-foreground",
  preparing: "border-transparent bg-tint-yellow text-foreground",
  active: "border-transparent bg-primary text-primary-foreground",
  operating: "border-transparent bg-tint-green text-foreground",
  on_hold: "border-dashed border-border bg-muted/60 text-muted-foreground",
  completed: "border-transparent bg-muted text-muted-foreground",
};

export function ProjectPhaseBadge({ phase }: { phase: ProjectPhase }) {
  return (
    <Badge variant="outline" className={cn(PROJECT_PHASE_CLASSNAME[phase])}>
      {PROJECT_PHASE_LABELS[phase]}
    </Badge>
  );
}
