import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="font-medium">ページが見つかりません</p>
      <p className="text-sm text-muted-foreground">
        タスクやスタッフが削除された可能性があります。
      </p>
      <Button render={<Link href="/home">ホームに戻る</Link>} />
    </div>
  );
}
