import Image from "next/image";
import { idolImages, type IdolImageKey } from "@/config/idolImages";
import { cn } from "@/lib/utils";

/**
 * ページの余白に配置する、背景透過を活かした等身大に近い推し画像。
 * 丸型トリミング・背景・枠は一切付けず、PNGの透過部分と縦横比をそのまま表示する。
 * 高さのみ指定し、幅は元画像のアスペクト比(4:5)から自動計算される。
 *
 * position:absoluteでの配置を前提としており、通常のドキュメントフローに
 * 高さを追加しない(=既存レイアウトを広げない)。負のz-index(pop-motif)で
 * 後続のカード・フォームより背面に置かれるため、要素が重なっても
 * カード側の内容が手前に表示され操作の邪魔にならない。
 * 呼び出し側でtop/right/heightなどをclassNameで指定して配置を調整する。
 *
 * 表示に十分な余白がないページでは、小さく縮めて置くのではなく
 * このコンポーネント自体を使わない(=画像を置かない)方を選ぶこと。
 */
export function IdolFigure({
  imageKey,
  className,
  sizes = "(min-width: 1024px) 190px, (min-width: 768px) 150px, 110px",
}: {
  imageKey: IdolImageKey;
  className?: string;
  sizes?: string;
}) {
  const { src, alt } = idolImages[imageKey];

  return (
    <span
      aria-hidden
      className={cn(
        "pop-motif hidden aspect-[4/5] w-auto shrink-0 sm:block",
        "h-[110px] md:h-[150px] lg:h-[190px]",
        className,
      )}
    >
      <Image src={src} alt={alt} fill sizes={sizes} className="object-contain" />
    </span>
  );
}

/**
 * 「対応なし」「発注対象なし」などの空状態に添える推し画像とひとこと。
 * IdolFigureと同様、丸型トリミング・背景・枠は付けずそのまま表示する
 * (空状態はスペースに余裕があるため、他の場所より大きめの100〜160px程度)。
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
      <span
        aria-hidden
        className="relative aspect-[4/5] h-[110px] w-auto shrink-0 sm:h-[130px]"
      >
        <Image src={src} alt={alt} fill sizes="130px" className="object-contain" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
      {caption && <p className="text-xs text-muted-foreground/80">{caption}</p>}
    </div>
  );
}
