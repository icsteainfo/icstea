"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="font-medium">問題が発生しました</p>
      <p className="text-sm text-muted-foreground">
        画面を読み込めませんでした。もう一度お試しください。
      </p>
      <Button onClick={() => retry()}>再読み込み</Button>
    </div>
  );
}
