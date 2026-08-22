import Link from "next/link";
import { TaskCheckbox } from "@/components/tasks/task-checkbox";
import { SyncInventoryButton } from "@/components/inventory/sync-inventory-button";
import { SparkleMotif } from "./motifs";
import type { InventoryCheckAlert } from "@/lib/inventory/types";

export function InventoryCheckAlertSection({ alerts }: { alerts: InventoryCheckAlert[] }) {
  return (
    <section className="shadow-dreamy relative isolate rounded-3xl border-2 border-tint-yellow-line bg-tint-yellow p-4">
      <SparkleMotif className="pop-motif pop-twinkle top-3 right-4 size-5 text-[#C98A00] opacity-80" />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">
          ⚠️ 今週の在庫対応
          {alerts.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {alerts.length}件
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {alerts[0].checked_on} の在庫チェックより
            </span>
          )}
          <SyncInventoryButton size="sm" label="スプレッドシートを更新" />
        </div>
      </div>
      {alerts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/60 py-6 text-center text-sm text-muted-foreground">
          対応が必要な在庫はありません
        </p>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                {alert.task_id && (
                  <div className="pt-1">
                    <TaskCheckbox taskId={alert.task_id} completed={false} />
                  </div>
                )}
                <div>
                  <p className="font-medium">{alert.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    必要 {alert.required_text || "-"} / 現在 {alert.current_text || "-"}
                    {alert.shortage !== null && `(不足 ${alert.shortage})`}
                  </p>
                </div>
              </div>
              {alert.task_id && (
                <Link
                  href={`/tasks/${alert.task_id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Todoを見る
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
