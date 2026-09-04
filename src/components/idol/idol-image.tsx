import Image from "next/image";
import { idolImages, type IdolImageKey } from "@/config/idolImages";
import { cn } from "@/lib/utils";

/**
 * ページタイトルやセクション見出し横に添える、小さな丸型の推し画像。
 * 業務情報より目立たないよう常に控えめなサイズで表示し、スマホでは非表示にする。
 */
export function IdolBadge({
  imageKey,
  className,
}: {
  imageKey: IdolImageKey;
  className?: string;
}) {
  const { src, alt } = idolImages[imageKey];

  return (
    <span
      aria-hidden
      className={cn(
        "relative hidden size-10 shrink-0 overflow-hidden rounded-full shadow-sm ring-1 ring-black/10 sm:inline-block dark:ring-white/15",
        className,
      )}
    >
      <Image src={src} alt={alt} fill sizes="56px" className="object-cover" />
    </span>
  );
}

/**
 * 「対応なし」「発注対象なし」などの空状態に添える推し画像とひとこと。
 * 既存のテキストのみの空状態メッセージと差し替えて使う。
 */
export function IdolEmptyState({
  message,
  caption,
  imageKey = "emptyState",
  className,
}: {
  message: string;
  caption?: string;
  imageKey?: IdolImageKey;
  className?: string;
}) {
  const { src, alt } = idolImages[imageKey];

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-6 text-center",
        className,
      )}
    >
      <span className="relative size-16 shrink-0 overflow-hidden rounded-full shadow-sm ring-1 ring-black/10 sm:size-20 dark:ring-white/15">
        <Image src={src} alt={alt} fill sizes="80px" className="object-cover" aria-hidden />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
      {caption && <p className="text-xs text-muted-foreground/80">{caption}</p>}
    </div>
  );
}
