import type { SVGProps } from "react";

type MotifProps = SVGProps<SVGSVGElement>;

/** 雲: カードの角からちょこっと覗かせる用 */
export function CloudMotif(props: MotifProps) {
  return (
    <svg viewBox="0 0 64 40" fill="none" aria-hidden {...props}>
      <path
        d="M14 30c-6.6 0-12-4.9-12-11S7.4 8 14 8c1 0 2 .1 3 .4C19.2 3.6 24.6 0 31 0c8 0 14.7 5.7 16.4 13.4 8.6.6 15.6 7.6 15.6 15.6 0 .3 0 .7-.1 1H14z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 星: タイトル横などに添える4方向のきらめき星 */
export function StarMotif(props: MotifProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M12 1c.9 4.8 2.2 8 4 9.7 1.8 1.6 5 2.9 9.7 4-4.8.9-8 2.2-9.7 4C14.4 20.4 13.1 23.6 12 28c-.9-4.4-2.2-7.6-4-9.3-1.8-1.8-5-3.1-9.7-4C3 13.6 6.2 12.3 8 10.7 9.8 9 11.1 5.8 12 1z"
        fill="currentColor"
      />
    </svg>
  );
}

/** ハート: 完了・お礼のフィードバックなどに */
export function HeartMotif(props: MotifProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M12 21s-7.5-4.6-10.2-9.3C.3 9 1.3 5 5 3.8 7.6 3 10.2 4 12 6.5 13.8 4 16.4 3 19 3.8c3.7 1.2 4.7 5.2 3.2 7.9C19.5 16.4 12 21 12 21z"
        fill="currentColor"
      />
    </svg>
  );
}

/** キラキラ: 小さな4方向スパークル。星より小さく添える用 */
export function SparkleMotif(props: MotifProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <path
        d="M9 1c.6 3 1.4 4.9 2.6 6.1C12.8 8.3 14.6 9.1 17 9.8c-2.4.7-4.2 1.5-5.4 2.7-1.2 1.2-2 3.1-2.6 6.1-.6-3-1.4-4.9-2.6-6.1C5.2 11.3 3.4 10.5 1 9.8c2.4-.7 4.2-1.5 5.4-2.7C7.6 5.9 8.4 4 9 1z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 虹: ページ上部などに置く控えめなアーチ */
export function RainbowMotif(props: MotifProps) {
  return (
    <svg viewBox="0 0 200 100" fill="none" aria-hidden {...props}>
      <path d="M6 100a94 94 0 0 1 188 0" stroke="#FF8FBC" strokeWidth="12" strokeLinecap="round" />
      <path d="M22 100a78 78 0 0 1 156 0" stroke="#FFE37E" strokeWidth="12" strokeLinecap="round" />
      <path d="M38 100a62 62 0 0 1 124 0" stroke="#AEE8D1" strokeWidth="12" strokeLinecap="round" />
      <path d="M54 100a46 46 0 0 1 92 0" stroke="#9DDBF5" strokeWidth="12" strokeLinecap="round" />
      <path d="M70 100a30 30 0 0 1 60 0" stroke="#CDB7F6" strokeWidth="12" strokeLinecap="round" />
    </svg>
  );
}

/** 太陽: あたたかいアクセント用 */
export function SunMotif(props: MotifProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle cx="12" cy="12" r="5.5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 1.5v3M12 19.5v3M22.5 12h-3M4.5 12h-3" />
        <path d="M19.1 4.9l-2.1 2.1M7 17l-2.1 2.1M19.1 19.1L17 17M7 7 4.9 4.9" />
      </g>
    </svg>
  );
}

/** 小さな花: 余白のワンポイントに */
export function FlowerMotif(props: MotifProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <g fill="currentColor">
        <circle cx="12" cy="6.2" r="3.4" />
        <circle cx="17.8" cy="12" r="3.4" />
        <circle cx="12" cy="17.8" r="3.4" />
        <circle cx="6.2" cy="12" r="3.4" />
      </g>
      <circle cx="12" cy="12" r="2.6" fill="#FFE37E" />
    </svg>
  );
}
