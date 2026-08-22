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
import { PROJECT_PHASE_LABELS } from "./project-phase-badge";
import type { ProjectPhase } from "@/types/database.types";

export function ProjectPhaseSelect({
  projectId,
  phase,
}: {
  projectId: string;
  phase: ProjectPhase;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(phase);
  const [updating, setUpdating] = useState(false);

  async function handleChange(value: string | null) {
    if (!value || value === current) return;
    const next = value as ProjectPhase;
    setUpdating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: next }),
      });
      if (!res.ok) throw new Error();
      setCurrent(next);
      toast.success("フェーズを変更しました");
      router.refresh();
    } catch {
      toast.error("変更に失敗しました");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Select items={PROJECT_PHASE_LABELS} value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-32" disabled={updating}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(PROJECT_PHASE_LABELS) as ProjectPhase[]).map((p) => (
          <SelectItem key={p} value={p}>
            {PROJECT_PHASE_LABELS[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
