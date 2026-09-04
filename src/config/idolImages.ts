export type IdolImageKey =
  | "home"
  | "inventory"
  | "cost"
  | "analytics"
  | "marketing"
  | "meeting"
  | "emptyState";

type IdolImageEntry = {
  src: string;
  alt: string;
};

// 推し画像を差し替えるときは、このファイルのパスを書き換えるか、
// 同名で /public/images/idol/ 配下のファイルを上書きするだけでよい。
// 画像は装飾目的のため alt は空にしている(スクリーンリーダーには読み上げない)。
export const idolImages: Record<IdolImageKey, IdolImageEntry> = {
  home: { src: "/images/idol/home-01.png", alt: "" },
  inventory: { src: "/images/idol/inventory-01.png", alt: "" },
  cost: { src: "/images/idol/cost-01.png", alt: "" },
  analytics: { src: "/images/idol/analytics-01.png", alt: "" },
  marketing: { src: "/images/idol/marketing-01.png", alt: "" },
  meeting: { src: "/images/idol/meeting-01.png", alt: "" },
  emptyState: { src: "/images/idol/empty-01.png", alt: "" },
};
