import { cn } from "@/lib/utils";
import { getCategoryTint } from "./category-tint";
import type { HomeSectionTint } from "@/components/home/section";

const TINT_BADGE_CLASSES: Record<HomeSectionTint, string> = {
  pink: "bg-tint-pink text-foreground border-tint-pink-line/70",
  green: "bg-tint-green text-foreground border-tint-green-line/70",
  blue: "bg-tint-blue text-foreground border-tint-blue-line/70",
  yellow: "bg-tint-yellow text-foreground border-tint-yellow-line/70",
  lavender: "bg-tint-lavender text-foreground border-tint-lavender-line/70",
};

export function CategoryTag({ name, className }: { name: string; className?: string }) {
  const tint = getCategoryTint(name);
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        TINT_BADGE_CLASSES[tint],
        className,
      )}
    >
      {name}
    </span>
  );
}
