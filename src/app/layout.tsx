import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_JP, Baloo_2 } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// 本文・タスク名・数字などに使う、読みやすさ最優先のUIフォント
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// "TODAY'S TASKS" のような短い英字の装飾見出し専用。タスク本文には使わない
const baloo2 = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "icsTEA 経営アシスタント",
  description: "毎日の経営アシスタント",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${geistMono.variable} ${baloo2.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
