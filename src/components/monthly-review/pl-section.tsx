"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resizeImageForUpload } from "@/lib/image-resize";
import { createClient } from "@/lib/supabase/client";
import { MONTHLY_REVIEW_ATTACHMENTS_BUCKET } from "@/lib/monthly-review/queries";
import type { MonthlyReview, PlLineItem, PlLineItemType } from "@/lib/monthly-review/types";
import { ManagementSummary } from "./management-summary";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, "application/pdf"];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
// 損益表は月ごとの列が並ぶ細かい表になっていることが多く、通常のスクショより高い解像度が必要なため引き上げる
const PL_IMAGE_MAX_DIMENSION = 2200;

// 会計ソフトから出力したPDFはリサイズせずそのままAIに渡す(テキスト・レイアウトを維持したほうが正確に読み取れるため)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
}

const TYPE_LABELS: Record<PlLineItemType, string> = {
  revenue: "収益",
  expense: "費用",
  reference: "検算用(経常利益等)",
};

type EditableLineItem = PlLineItem & { id: string };

function toEditable(items: PlLineItem[]): EditableLineItem[] {
  return items.map((item) => ({ ...item, id: crypto.randomUUID() }));
}

export function PlSection({ review }: { review: MonthlyReview }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<EditableLineItem[]>(() =>
    toEditable(review.pl_line_items),
  );
  const [savedImagePath, setSavedImagePath] = useState(review.pl_image_storage_path);
  const [savedImageName, setSavedImageName] = useState(review.pl_image_file_name);
  const [openingImage, setOpeningImage] = useState(false);

  function selectFile(next: File | undefined | null) {
    if (!next) return;
    if (!ACCEPTED_FILE_TYPES.includes(next.type)) {
      toast.error("JPEG・PNG・WebPの画像、またはPDFを選択してください");
      return;
    }
    if (next.size > MAX_FILE_SIZE) {
      toast.error("ファイルサイズは15MBまでです");
      return;
    }
    setFile(next);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next.type === "application/pdf" ? null : URL.createObjectURL(next);
    });
  }

  async function handleParse() {
    if (!file) {
      toast.error("損益表の写真・PDFを選択してください");
      return;
    }
    setParsing(true);
    try {
      const { base64, mediaType } =
        file.type === "application/pdf"
          ? { base64: await fileToBase64(file), mediaType: "application/pdf" as const }
          : await resizeImageForUpload(file, PL_IMAGE_MAX_DIMENSION);
      const res = await fetch("/api/monthly-reviews/parse-pl-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType, month: review.month }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "読み取りに失敗しました");
      }
      const body = await res.json();
      setItems(toEditable(body.lineItems));
      toast.success("損益表を読み取りました。内容を確認して保存してください");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "読み取りに失敗しました");
    } finally {
      setParsing(false);
    }
  }

  function updateItem(id: string, patch: Partial<EditableLineItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", amount: 0, type: "expense" },
    ]);
  }

  async function handleOpenImage() {
    if (!savedImagePath) return;
    setOpeningImage(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from(MONTHLY_REVIEW_ATTACHMENTS_BUCKET)
        .createSignedUrl(savedImagePath, 60);
      if (error || !data) throw error ?? new Error();
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("ファイルを開けませんでした");
    } finally {
      setOpeningImage(false);
    }
  }

  async function handleSave() {
    const cleaned = items
      .map((item) => ({ ...item, label: item.label.trim() }))
      .filter((item) => item.label.length > 0);
    if (cleaned.length !== items.length) {
      toast.error("項目名が空の行があります");
      return;
    }

    setSaving(true);
    try {
      let storagePath = savedImagePath;
      let fileName = savedImageName;

      if (file) {
        const supabase = createClient();
        const extMatch = /\.[a-zA-Z0-9]+$/.exec(file.name);
        const ext = extMatch ? extMatch[0] : "";
        const nextPath = `${review.id}/${crypto.randomUUID()}${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(MONTHLY_REVIEW_ATTACHMENTS_BUCKET)
          .upload(nextPath, file);
        if (uploadError) throw new Error(`ファイルのアップロードに失敗しました: ${uploadError.message}`);

        if (savedImagePath) {
          await supabase.storage.from(MONTHLY_REVIEW_ATTACHMENTS_BUCKET).remove([savedImagePath]);
        }
        storagePath = nextPath;
        fileName = file.name;
      }

      const res = await fetch(`/api/monthly-reviews/${review.id}/pl`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pl_image_storage_path: storagePath,
          pl_image_file_name: fileName,
          pl_line_items: cleaned.map(({ label, amount, type }) => ({ label, amount, type })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "保存に失敗しました");
      }

      setSavedImagePath(storagePath);
      setSavedImageName(fileName);
      setFile(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("損益データを保存しました");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          selectFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        {file && !previewUrl ? (
          <div className="flex items-center gap-2 text-sm">
            <FileIcon className="size-5 text-muted-foreground" />
            {file.name}
          </div>
        ) : previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="選択した損益表のプレビュー"
            className="max-h-56 rounded-md object-contain"
          />
        ) : (
          <>
            <p className="text-sm font-medium">
              損益表の写真・PDFをドラッグ&ドロップ、またはクリックして選択
            </p>
            <p className="text-xs text-muted-foreground">
              PDF(会計ソフトの出力ファイルなど、可能ならPDFの方が読み取り精度が高くなります)・JPEG・PNG・WebP
            </p>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => selectFile(e.target.files?.[0])}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {savedImagePath && !file && (
            <Button type="button" variant="outline" size="sm" onClick={handleOpenImage} disabled={openingImage}>
              {savedImageName ?? "保存済みのファイル"}を見る
            </Button>
          )}
        </div>
        <Button type="button" onClick={handleParse} disabled={parsing || !file}>
          {parsing ? "読み取り中..." : "AIで読み取る"}
        </Button>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
            まだ項目がありません。写真・PDFから読み取るか、下から手入力してください
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <Input
                value={item.label}
                onChange={(e) => updateItem(item.id, { label: e.target.value })}
                placeholder="項目名(例: 商品売上)"
                className="flex-1"
              />
              <Input
                type="number"
                value={item.amount}
                onChange={(e) => updateItem(item.id, { amount: Number(e.target.value) })}
                className="w-32"
              />
              <Select
                items={TYPE_LABELS}
                value={item.type}
                onValueChange={(v: string | null) =>
                  v && updateItem(item.id, { type: v as PlLineItemType })
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">収益</SelectItem>
                  <SelectItem value="expense">費用</SelectItem>
                  <SelectItem value="reference">検算用(経常利益等)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeItem(item.id)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))
        )}
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          行を追加
        </Button>
      </div>

      <ManagementSummary items={items} />

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "損益データを保存"}
        </Button>
      </div>
    </div>
  );
}
