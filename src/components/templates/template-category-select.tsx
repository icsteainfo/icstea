"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/tasks/types";

const NO_CATEGORY = "__none__";

export function TemplateCategorySelect({
  templateId,
  categoryId,
  categories,
}: {
  templateId: string;
  categoryId: string | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(categoryId ?? NO_CATEGORY);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string | null) {
    const nextValue = next ?? NO_CATEGORY;
    setValue(nextValue);
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: nextValue === NO_CATEGORY ? null : nextValue,
        }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Select
      items={{
        [NO_CATEGORY]: "未設定",
        ...Object.fromEntries(categories.map((c) => [c.id, c.name])),
      }}
      value={value}
      onValueChange={handleChange}
      disabled={saving}
    >
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_CATEGORY}>未設定</SelectItem>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
