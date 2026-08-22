import Image from "next/image";
import { HeartMotif, SparkleMotif } from "@/components/home/motifs";
import { cn } from "@/lib/utils";

export type CharacterId = "main" | "sweetdream";

// キャラクター画像を追加/差し替えるときは、ここのパスを /public/characters 配下の
// 実ファイル名に変更するだけでよい。未設定(null)の間はプレースホルダーのバブルが表示される。
const CHARACTER_SRC: Record<CharacterId, string | null> = {
  main: "/characters/2.png",
  sweetdream: "/characters/3.png",
};

export function CharacterMascot({
  character = "main",
  size = 150,
  alt = "icsTEAのキャラクター",
  className,
}: {
  character?: CharacterId;
  size?: number;
  alt?: string;
  className?: string;
}) {
  const src = CHARACTER_SRC[character];

  if (!src) {
    return (
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full border-4 border-dashed border-tint-lavender-line/50 bg-tint-lavender",
          className,
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <HeartMotif className="size-1/3 text-brand-pink opacity-70" />
        <SparkleMotif className="pop-twinkle absolute top-2 right-3 size-5 text-[#A97EF0]" />
        <SparkleMotif className="pop-twinkle absolute bottom-3 left-2 size-3 text-[#FF5F9E]" />
      </div>
    );
  }

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-contain drop-shadow-[0_10px_18px_rgba(214,49,111,0.28)]"
      />
    </div>
  );
}
