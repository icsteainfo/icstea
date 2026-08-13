"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Channel } from "@/lib/sales/types";
import { getTodayDateString } from "@/lib/date";

const CHANNEL_LABELS: Record<Exclude<Channel, "stores">, string> = {
  airregi: "エアレジ",
  uber_eats: "Uber Eats",
  rocket_now: "ロケットナウ",
};

export function SalesImportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [channel, setChannel] = useState<Channel>("airregi");
  const [fileType, setFileType] = useState<"summary" | "products">("summary");
  const [date, setDate] = useState(getTodayDateString());
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("ファイルを選択してください");
      return;
    }
    if (channel === "airregi" && fileType === "products" && !date) {
      toast.error("対象日を指定してください");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("channel", channel);
      formData.append("fileType", fileType);
      if (channel === "airregi" && fileType === "products") {
        formData.append("date", date);
      }
      formData.append("file", file);

      const res = await fetch("/api/sales/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "取込に失敗しました");
      }

      const body = await res.json();
      toast.success(`${body.imported}件を取り込みました`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "取込に失敗しました");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>チャネル</Label>
          <Select
            items={CHANNEL_LABELS}
            value={channel}
            onValueChange={(v: string | null) => v && setChannel(v as Channel)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {channel === "airregi" && (
          <div className="space-y-2">
            <Label>ファイルの種類</Label>
            <Select
              items={{ summary: "売上集計(日別)", products: "商品別売上" }}
              value={fileType}
              onValueChange={(v: string | null) =>
                v && setFileType(v as "summary" | "products")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">売上集計(日別)</SelectItem>
                <SelectItem value="products">商品別売上</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {channel === "airregi" && fileType === "products" && (
        <div className="space-y-2">
          <Label htmlFor="import-date">対象日</Label>
          <Input
            id="import-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="import-file">CSVファイル</Label>
        <Input id="import-file" type="file" accept=".csv" ref={fileInputRef} />
      </div>

      <Button type="submit" disabled={uploading}>
        {uploading ? "取込中..." : "取り込む"}
      </Button>
    </form>
  );
}
