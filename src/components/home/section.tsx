import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type HomeSectionTint = "pink" | "green" | "blue" | "yellow" | "lavender";

const TINT_CLASSES: Record<HomeSectionTint, string> = {
  pink: "bg-tint-pink border-tint-pink-line",
  green: "bg-tint-green border-tint-green-line",
  blue: "bg-tint-blue border-tint-blue-line",
  yellow: "bg-tint-yellow border-tint-yellow-line",
  lavender: "bg-tint-lavender border-tint-lavender-line",
};

export function HomeSection({
  title,
  description,
  emptyMessage,
  count,
  collapsible,
  defaultOpen,
  tint,
  children,
}: {
  title: string;
  description?: string;
  emptyMessage: string;
  count: number;
  collapsible?: boolean;
  defaultOpen?: boolean;
  tint?: HomeSectionTint;
  children: ReactNode;
}) {
  const heading = (
    <h2 className="text-lg font-semibold">
      {title}
      {count > 0 && (
        <span className="ml-2 text-sm font-normal text-muted-foreground">{count}件</span>
      )}
    </h2>
  );

  const body =
    count === 0 ? (
      <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    ) : (
      <div className="space-y-2">{children}</div>
    );

  const panelClassName = tint
    ? cn("rounded-xl border p-4", TINT_CLASSES[tint])
    : "space-y-2";

  if (!collapsible) {
    return (
      <section className={panelClassName}>
        <div className={tint ? "mb-2" : undefined}>
          {heading}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {body}
      </section>
    );
  }

  return (
    <details className={cn("group", panelClassName)} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <div>
          {heading}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="pt-2">{body}</div>
    </details>
  );
}
