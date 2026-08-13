"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, Staff } from "@/lib/tasks/types";

const ALL = "__all__";

export function TaskFilters({
  categories,
  staff,
}: {
  categories: Category[];
  staff: Staff[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/tasks?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        items={{ [ALL]: "すべての状態", open: "未完了", completed: "完了済み" }}
        value={searchParams.get("status") ?? ALL}
        onValueChange={(v) => setParam("status", v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="状態" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>すべての状態</SelectItem>
          <SelectItem value="open">未完了</SelectItem>
          <SelectItem value="completed">完了済み</SelectItem>
        </SelectContent>
      </Select>

      <Select
        items={{
          [ALL]: "すべてのカテゴリー",
          ...Object.fromEntries(categories.map((c) => [c.id, c.name])),
        }}
        value={searchParams.get("category_id") ?? ALL}
        onValueChange={(v) => setParam("category_id", v)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="カテゴリー" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>すべてのカテゴリー</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={{
          [ALL]: "すべての担当",
          owner: "自分",
          ...Object.fromEntries(staff.map((s) => [s.id, s.name])),
        }}
        value={
          searchParams.get("assignee_type") === "owner"
            ? "owner"
            : (searchParams.get("assignee_staff_id") ?? ALL)
        }
        onValueChange={(v: string | null) => {
          if (!v) return;
          const params = new URLSearchParams(searchParams.toString());
          if (v === ALL) {
            params.delete("assignee_type");
            params.delete("assignee_staff_id");
          } else if (v === "owner") {
            params.set("assignee_type", "owner");
            params.delete("assignee_staff_id");
          } else {
            params.set("assignee_type", "staff");
            params.set("assignee_staff_id", v);
          }
          router.push(`/tasks?${params.toString()}`);
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="担当" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>すべての担当</SelectItem>
          <SelectItem value="owner">自分</SelectItem>
          {staff.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
