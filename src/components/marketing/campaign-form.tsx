"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CAMPAIGN_TYPE_LABELS, type CampaignType } from "@/lib/marketing/types";
import { getTodayDateString } from "@/lib/date";
import type { MenuItem } from "@/lib/sales/types";

const NO_MENU_ITEM = "__none__";

export function CampaignForm({ menuItems }: { menuItems: MenuItem[] }) {
  const router = useRouter();
  const [type, setType] = useState<CampaignType>("instagram_post");
  const [date, setDate] = useState(getTodayDateString());
  const [menuItemId, setMenuItemId] = useState(NO_MENU_ITEM);
  const [adCost, setAdCost] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          date,
          menu_item_id: menuItemId === NO_MENU_ITEM ? null : menuItemId,
          ad_cost: adCost ? Number(adCost) : null,
          memo: memo || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "登録に失敗しました");
      }
      toast.success("施策を記録しました");
      setMemo("");
      setAdCost("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>施策の種類</Label>
          <Select
            items={CAMPAIGN_TYPE_LABELS}
            value={type}
            onValueChange={(v: string | null) => v && setType(v as CampaignType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CAMPAIGN_TYPE_LABELS) as CampaignType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {CAMPAIGN_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign-date">実施日</Label>
          <Input
            id="campaign-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>対象商品</Label>
          <Select
            items={{
              [NO_MENU_ITEM]: "店舗全体(商品指定なし)",
              ...Object.fromEntries(menuItems.map((m) => [m.id, m.name])),
            }}
            value={menuItemId}
            onValueChange={(v: string | null) => setMenuItemId(v ?? NO_MENU_ITEM)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_MENU_ITEM}>店舗全体(商品指定なし)</SelectItem>
              {menuItems.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ad-cost">広告費(円・任意)</Label>
          <Input
            id="ad-cost"
            type="number"
            min={0}
            value={adCost}
            onChange={(e) => setAdCost(e.target.value)}
            placeholder="広告以外は空欄でOK"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-memo">メモ</Label>
        <Textarea
          id="campaign-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "記録中..." : "施策を記録"}
      </Button>
    </form>
  );
}
