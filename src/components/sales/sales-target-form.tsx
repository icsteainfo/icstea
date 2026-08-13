"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SalesTargetForm({
  month,
  initialTarget,
}: {
  month: string;
  initialTarget: number | null;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(initialTarget?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!amount || !Number.isFinite(value) || value < 0) {
      toast.error("正しい金額を入力してください");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/sales/target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, target_amount: value }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "保存に失敗しました");
      }
      toast.success("目標を保存しました");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="target-amount">{month} の目標売上(円)</Label>
        <Input
          id="target-amount"
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-40"
        />
      </div>
      <Button type="submit" disabled={saving} size="sm">
        保存
      </Button>
    </form>
  );
}
