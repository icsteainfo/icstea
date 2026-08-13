"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Item = { id: string; name: string };

export function NameListManager({
  apiBasePath,
  items,
  addPlaceholder,
  deleteConfirmLabel,
  linkPrefix,
}: {
  apiBasePath: string;
  items: Item[];
  addPlaceholder: string;
  deleteConfirmLabel: string;
  linkPrefix?: string;
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(apiBasePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error();
      setNewName("");
      toast.success("追加しました");
      router.refresh();
    } catch {
      toast.error("追加に失敗しました");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditingName(item.name);
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return;
    try {
      const res = await fetch(`${apiBasePath}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("更新しました");
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error("更新に失敗しました");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${apiBasePath}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("削除しました");
      router.refresh();
    } catch {
      toast.error("削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={addPlaceholder}
        />
        <Button type="submit" disabled={adding}>
          追加
        </Button>
      </form>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            まだ登録がありません
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-lg border bg-background p-3"
          >
            {editingId === item.id ? (
              <>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={() => handleRename(item.id)}>
                  保存
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(null)}
                >
                  キャンセル
                </Button>
              </>
            ) : (
              <>
                {linkPrefix ? (
                  <Link
                    href={`${linkPrefix}/${item.id}`}
                    className="flex-1 hover:underline"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="flex-1">{item.name}</span>
                )}
                <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                  編集
                </Button>
                <Dialog
                  open={deletingId === item.id}
                  onOpenChange={(open) => setDeletingId(open ? item.id : null)}
                >
                  <DialogTrigger
                    render={
                      <Button size="sm" variant="destructive">
                        削除
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{item.name}を削除しますか？</DialogTitle>
                      <DialogDescription>{deleteConfirmLabel}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeletingId(null)}>
                        キャンセル
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        削除する
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
