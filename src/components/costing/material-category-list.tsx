"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatNumber } from "@/lib/format";
import {
  MaterialOrderButton,
  MaterialReceiveButton,
} from "@/components/costing/material-order-receive-buttons";

export type MaterialCategoryItem = {
  id: string;
  name: string;
  hasCost: boolean;
  category: string;
  supplier: string | null;
  unit: string;
  purchasePrice: number | null;
  packageAmount: number | null;
  unitCost: number | null;
  currentStock: number | null;
  usageLabel: string | null;
  reorderBadge: { label: string; variant: "destructive" | "outline" } | null;
  lastOrderedAt: string | null;
  lastReceivedAt: string | null;
};

export type MaterialCategoryGroup = {
  name: string;
  emoji: string;
  items: MaterialCategoryItem[];
};

// カテゴリーごとの見出し・行の背景色(既存のtintトークンを、カテゴリー数ぶん循環利用する。
// 文字の読みやすさのため薄めに)。
const TINT_STYLES: { header: string; row: string }[] = [
  { header: "bg-tint-green/70", row: "bg-tint-green/25" },
  { header: "bg-tint-blue/70", row: "bg-tint-blue/25" },
  { header: "bg-tint-yellow/70", row: "bg-tint-yellow/25" },
  { header: "bg-tint-pink/70", row: "bg-tint-pink/25" },
  { header: "bg-tint-lavender/70", row: "bg-tint-lavender/25" },
];

function MaterialRow({
  item,
  organizing,
  selected,
  onToggleSelect,
}: {
  item: MaterialCategoryItem;
  organizing: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const nameLabel = (
    <>
      {!item.hasCost && (
        <span className="mr-1 font-semibold text-destructive" title="仕入価格が未設定です">
          ⚠️
        </span>
      )}
      {item.name}
      {item.reorderBadge && (
        <Badge variant={item.reorderBadge.variant} className="ml-1.5 align-middle">
          {item.reorderBadge.label}
        </Badge>
      )}
    </>
  );

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-t border-black/5 ${isDragging ? "opacity-50" : ""}`}
    >
      <td className="w-8 px-1 py-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="並び替え"
        >
          <GripVerticalIcon className="h-3.5 w-3.5" />
        </button>
      </td>
      {organizing && (
        <td className="w-8 px-1 py-2">
          <Checkbox checked={selected} onCheckedChange={() => onToggleSelect(item.id)} />
        </td>
      )}
      <td className="px-2 py-2 font-medium">
        {organizing ? (
          <label className="flex cursor-pointer items-center">{nameLabel}</label>
        ) : (
          <Link href={`/products/${item.id}?from=materials`} className="hover:underline">
            {nameLabel}
          </Link>
        )}
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">{item.category}</td>
      <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">{item.supplier ?? "—"}</td>
      <td className="whitespace-nowrap px-2 py-2 text-right">
        {item.purchasePrice != null ? `¥${formatNumber(item.purchasePrice)}` : "—"}
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right">
        {item.packageAmount != null ? `${formatNumber(item.packageAmount)}${item.unit}` : "—"}
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right font-medium">
        {item.unitCost != null ? `¥${item.unitCost.toFixed(2)}/${item.unit}` : "—"}
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right">
        {item.currentStock != null ? `${formatNumber(item.currentStock)}${item.unit}` : "—"}
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right text-muted-foreground">
        {item.usageLabel ?? "—"}
      </td>
      <td className="px-2 py-2">{!organizing && <MaterialOrderButton productId={item.id} lastOrderedAt={item.lastOrderedAt} />}</td>
      <td className="px-2 py-2">{!organizing && <MaterialReceiveButton productId={item.id} lastReceivedAt={item.lastReceivedAt} />}</td>
    </tr>
  );
}

function CategorySection({
  group,
  style,
  organizing,
  selected,
  onToggleSelect,
}: {
  group: MaterialCategoryGroup;
  style: { header: string; row: string };
  organizing: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState(group.items);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = items;
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    try {
      const res = await fetch("/api/costing/materials/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((i) => i.id) }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setItems(previous);
      toast.error("並び替えに失敗しました");
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left ${style.header}`}
      >
        <span className="flex items-center gap-2 font-medium">
          <span aria-hidden>{group.emoji}</span>
          {group.name}
          <Badge variant="secondary">{items.length}件</Badge>
        </span>
        <span className="text-muted-foreground">{open ? "︿" : "﹀"}</span>
      </button>
      {open && (
        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className={`text-xs text-muted-foreground ${style.row}`}>
                  <th className="w-8 px-1 py-1.5" />
                  {organizing && <th className="w-8 px-1 py-1.5" />}
                  <th className="px-2 py-1.5 text-left font-medium">商品名</th>
                  <th className="px-2 py-1.5 text-left font-medium">カテゴリー</th>
                  <th className="px-2 py-1.5 text-left font-medium">仕入先</th>
                  <th className="px-2 py-1.5 text-right font-medium">仕入価格</th>
                  <th className="px-2 py-1.5 text-right font-medium">内容量・入数</th>
                  <th className="px-2 py-1.5 text-right font-medium">単価</th>
                  <th className="px-2 py-1.5 text-right font-medium">現在庫</th>
                  <th className="px-2 py-1.5 text-right font-medium">使用量</th>
                  <th className="px-2 py-1.5 text-left font-medium">発注</th>
                  <th className="px-2 py-1.5 text-left font-medium">入荷</th>
                </tr>
              </thead>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <tbody className={style.row}>
                  {items.map((item) => (
                    <MaterialRow
                      key={item.id}
                      item={item}
                      organizing={organizing}
                      selected={selected.has(item.id)}
                      onToggleSelect={onToggleSelect}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      )}
    </div>
  );
}

export function MaterialCategoryList({
  groups,
  organizing = false,
  selected,
  onToggleSelect,
}: {
  groups: MaterialCategoryGroup[];
  organizing?: boolean;
  selected?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const visibleGroups = groups.filter((g) => g.items.length > 0);

  if (visibleGroups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        原材料・資材がまだ登録されていません。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visibleGroups.map((group, index) => (
        <CategorySection
          key={group.name}
          group={group}
          style={TINT_STYLES[index % TINT_STYLES.length]}
          organizing={organizing}
          selected={selected ?? new Set()}
          onToggleSelect={onToggleSelect ?? (() => {})}
        />
      ))}
    </div>
  );
}
