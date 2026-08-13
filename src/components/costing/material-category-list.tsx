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
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type MaterialCategoryItem = { id: string; name: string; hasCost: boolean };

export type MaterialCategoryGroup = {
  name: string;
  emoji: string;
  items: MaterialCategoryItem[];
};

function MaterialChip({ item }: { item: MaterialCategoryItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 rounded-full border bg-background py-1 pl-1 pr-3 text-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="並び替え"
      >
        <GripVerticalIcon className="h-3.5 w-3.5" />
      </button>
      <Link href={`/products/${item.id}`} className="hover:underline">
        {!item.hasCost && (
          <span className="mr-1 font-semibold text-destructive" title="仕入価格が未設定です">
            ⚠️
          </span>
        )}
        {item.name}
      </Link>
    </div>
  );
}

function CategorySection({ group }: { group: MaterialCategoryGroup }) {
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
    <div className="rounded-lg border bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-left hover:bg-muted/40"
      >
        <span className="flex items-center gap-2 font-medium">
          <span aria-hidden>{group.emoji}</span>
          {group.name}
          <Badge variant="secondary">{items.length}件</Badge>
        </span>
        <span className="text-muted-foreground">{open ? "︿" : "﹀"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <MaterialChip key={item.id} item={item} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

export function MaterialCategoryList({ groups }: { groups: MaterialCategoryGroup[] }) {
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
      {visibleGroups.map((group) => (
        <CategorySection key={group.name} group={group} />
      ))}
    </div>
  );
}
