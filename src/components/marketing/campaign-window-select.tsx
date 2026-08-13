"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OPTIONS: Record<string, string> = {
  "7": "前後7日で比較",
  "14": "前後14日で比較",
  "30": "前後30日で比較",
};

export function CampaignWindowSelect({ windowDays }: { windowDays: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("window", value);
    router.push(`/marketing?${params.toString()}`);
  }

  return (
    <Select items={OPTIONS} value={String(windowDays)} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(OPTIONS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
