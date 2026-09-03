import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InitiativeStatus } from "@/types/database.types";

export const INITIATIVE_STATUS_LABELS: Record<InitiativeStatus, string> = {
  want: "やりたい",
  in_progress: "取り組み中",
  must: "やらなければ",
};

const INITIATIVE_STATUS_CLASSNAME: Record<InitiativeStatus, string> = {
  want: "border-transparent bg-tint-blue text-foreground",
  in_progress: "border-transparent bg-primary text-primary-foreground",
  must: "border-transparent bg-tint-yellow text-foreground",
};

export function InitiativeStatusBadge({ status }: { status: InitiativeStatus }) {
  return (
    <Badge variant="outline" className={cn(INITIATIVE_STATUS_CLASSNAME[status])}>
      {INITIATIVE_STATUS_LABELS[status]}
    </Badge>
  );
}
