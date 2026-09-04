import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CloudMotif, FlowerMotif, HeartMotif, SparkleMotif, StarMotif } from "./motifs";

export type HomeSectionTint = "pink" | "green" | "blue" | "yellow" | "lavender";

// セクションの背景はあくまで「見出し・枠線と合わせて種類を示す薄い地色」に留め、
// 中の行(TaskRowCompactなど)を白ベースで読みやすくするための余地を残す。
const TINT_CLASSES: Record<HomeSectionTint, string> = {
  pink: "bg-tint-pink/20 border-tint-pink-line",
  green: "bg-tint-green/20 border-tint-green-line",
  blue: "bg-tint-blue/20 border-tint-blue-line",
  yellow: "bg-tint-yellow/20 border-tint-yellow-line",
  lavender: "bg-tint-lavender/20 border-tint-lavender-line",
};

const TINT_MOTIF: Record<HomeSectionTint, ReactNode> = {
  pink: <HeartMotif className="pop-motif top-3 right-4 size-6 text-[#FF8FBC] opacity-70" />,
  green: <FlowerMotif className="pop-motif top-3 right-4 size-6 opacity-70" />,
  blue: <CloudMotif className="pop-motif -top-1 -right-2 size-10 text-[#9DDBF5] opacity-80" />,
  yellow: (
    <SparkleMotif className="pop-motif pop-twinkle top-3 right-4 size-5 text-[#F0B429] opacity-80" />
  ),
  lavender: <StarMotif className="pop-motif top-2 right-4 size-6 text-[#CDB7F6] opacity-80" />,
};

export function HomeSection({
  title,
  description,
  emptyMessage,
  emptySlot,
  count,
  collapsible,
  defaultOpen,
  tint,
  children,
}: {
  title: string;
  description?: string;
  emptyMessage: string;
  /** 空状態の表示を差し替えたいとき(推し画像入りの空状態など)に渡す */
  emptySlot?: ReactNode;
  count: number;
  collapsible?: boolean;
  defaultOpen?: boolean;
  tint?: HomeSectionTint;
  children: ReactNode;
}) {
  const heading = (
    <h2 className="text-lg font-bold">
      {title}
      {count > 0 && (
        <span className="ml-2 text-sm font-normal text-muted-foreground">{count}件</span>
      )}
    </h2>
  );

  const body =
    count === 0 ? (
      emptySlot ?? (
        <p className="rounded-2xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      )
    ) : (
      <div className="space-y-2">{children}</div>
    );

  const panelClassName = tint
    ? cn("relative isolate rounded-3xl border-2 p-3 shadow-dreamy", TINT_CLASSES[tint])
    : "space-y-2";

  if (!collapsible) {
    return (
      <section className={panelClassName}>
        {tint && TINT_MOTIF[tint]}
        <div className={tint ? "mb-1.5" : undefined}>
          {heading}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {body}
      </section>
    );
  }

  return (
    <details className={cn("group", panelClassName)} open={defaultOpen}>
      {tint && TINT_MOTIF[tint]}
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <div>
          {heading}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="pt-1.5">{body}</div>
    </details>
  );
}
