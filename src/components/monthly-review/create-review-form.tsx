"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTodayDateString } from "@/lib/date";

function getCurrentMonth() {
  return getTodayDateString().slice(0, 7);
}

export function CreateReviewForm() {
  const router = useRouter();
  const [month, setMonth] = useState(getCurrentMonth());
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!month) {
      toast.error("月を選択してください");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/monthly-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "作成に失敗しました");
      }
      const { review } = await res.json();
      router.push(`/monthly-review/${review.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="review-month">対象月</Label>
        <Input
          id="review-month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-40"
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "作成中..." : "この月のMTGを作成"}
      </Button>
    </form>
  );
}
