import { Badge } from "@/components/ui/badge";
import type { TaskProgress } from "@/lib/subtasks/types";

export function ProgressBadge({ progress }: { progress: TaskProgress }) {
  return (
    <Badge variant="secondary">
      {progress.completed}/{progress.total}完了({progress.percent}%)
      {progress.isOverride && " ・手動"}
    </Badge>
  );
}
