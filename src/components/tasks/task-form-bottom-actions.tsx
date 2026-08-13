"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function TaskFormBottomActions({
  formId,
  submitLabel,
}: {
  formId: string;
  submitLabel: string;
}) {
  const router = useRouter();

  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={() => router.push("/tasks")}>
        キャンセル
      </Button>
      <Button type="submit" form={formId}>
        {submitLabel}
      </Button>
    </div>
  );
}
