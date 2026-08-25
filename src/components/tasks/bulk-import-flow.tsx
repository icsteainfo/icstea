"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BulkImportCandidateCard,
  type EditableCandidate,
} from "@/components/tasks/bulk-import-candidate-card";
import { resizeImageForUpload } from "@/lib/image-resize";
import type { Category, Staff } from "@/lib/tasks/types";
import type { PriorityLevel } from "@/types/database.types";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_FILE_SIZE = 15 * 1024 * 1024; // 15MB

type TemplateOption = {
  id: string;
  name: string;
  categoryId: string | null;
  subtaskTitles: string[];
};

type DuplicateCandidate = { id: string; title: string };

type ParsedCandidate = {
  title: string;
  subtasks: { title: string; completed: boolean }[];
  categoryId: string | null;
  dueDate: string | null;
  assigneeStaffId: string | null;
  priority: PriorityLevel;
  templateId: string | null;
  duplicateTaskIds: string[];
};

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `bulk-import-candidate-${idCounter}`;
}

const EXAMPLE_TEXT =
  "ギフト用紙袋を作る\n・紙袋購入\n・シルク購入\n・試作\n・本番印刷";

export function BulkImportFlow({
  categories,
  staff,
  templates,
}: {
  categories: Category[];
  staff: Staff[];
  templates: TemplateOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<"paste" | "review">("paste");
  const [mode, setMode] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState<EditableCandidate[]>([]);
  const [duplicateCandidates, setDuplicateCandidates] = useState<
    DuplicateCandidate[]
  >([]);

  function applyParsedResult(data: {
    candidates: ParsedCandidate[];
    duplicateCandidatesConsidered: DuplicateCandidate[];
  }) {
    setDuplicateCandidates(data.duplicateCandidatesConsidered);
    setCandidates(
      data.candidates.map((c) => ({
        id: nextId(),
        action: c.duplicateTaskIds.length > 0 ? "attach" : "create",
        title: c.title,
        subtasks: c.subtasks,
        categoryId: c.categoryId,
        dueDate: c.dueDate,
        assigneeStaffId: c.assigneeStaffId,
        priority: c.priority,
        templateId: c.templateId,
        templateApplied: false,
        duplicateTaskIds: c.duplicateTaskIds,
        targetExistingTaskId: c.duplicateTaskIds[0] ?? null,
      })),
    );
    setStep("review");
  }

  async function handleParse() {
    if (!text.trim()) {
      toast.error("テキストを入力してください");
      return;
    }
    setParsing(true);
    try {
      const res = await fetch("/api/tasks/bulk-import/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "解析に失敗しました");
      }
      applyParsedResult(await res.json());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "解析に失敗しました");
    } finally {
      setParsing(false);
    }
  }

  function selectImageFile(file: File | undefined | null) {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("JPEG・PNG・WebPなどの画像形式を選択してください");
      return;
    }
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      toast.error("画像サイズは15MBまでです");
      return;
    }
    setImageFile(file);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function clearImage() {
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleParseImage() {
    if (!imageFile) {
      toast.error("画像を選択してください");
      return;
    }
    setParsing(true);
    try {
      const { base64, mediaType } = await resizeImageForUpload(imageFile);
      const res = await fetch("/api/tasks/bulk-import/parse-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "解析に失敗しました");
      }
      applyParsedResult(await res.json());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "解析に失敗しました");
    } finally {
      setParsing(false);
    }
  }

  function updateCandidate(id: string, patch: Partial<EditableCandidate>) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  }

  async function handleConfirm() {
    const targets = candidates.filter((c) => c.action !== "exclude");
    if (targets.length === 0) {
      toast.error("登録するTodoを1つ以上選択してください");
      return;
    }
    for (const c of targets) {
      if (!c.title.trim()) {
        toast.error("タイトルが空のTodoがあります");
        return;
      }
      if (c.action === "attach" && !c.targetExistingTaskId) {
        toast.error("追加先の既存タスクを選択してください");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks/bulk-import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: targets.map((c) => ({
            action: c.action,
            title: c.title,
            subtasks: c.subtasks.filter((s) => s.title.trim().length > 0),
            categoryId: c.categoryId,
            dueDate: c.dueDate,
            assigneeStaffId: c.assigneeStaffId,
            priority: c.priority,
            targetExistingTaskId:
              c.action === "attach" ? c.targetExistingTaskId : null,
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "登録に失敗しました");
      }
      toast.success("選択したTodoを登録しました");
      router.push("/home");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "paste") {
    return (
      <div className="space-y-4">
        <Tabs value={mode} onValueChange={(v) => v && setMode(v as "text" | "image")}>
          <TabsList>
            <TabsTrigger value="text">文章を貼り付け</TabsTrigger>
            <TabsTrigger value="image">スクショ・画像をアップロード</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="pt-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={14}
              placeholder={`ChatGPTなどでまとめたTodoをここに貼り付けてください\n\n例:\n${EXAMPLE_TEXT}`}
            />
          </TabsContent>

          <TabsContent value="image" className="pt-4">
            <div className="space-y-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  selectImageFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {imagePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreviewUrl}
                    alt="アップロードした画像のプレビュー"
                    className="max-h-64 rounded-md object-contain"
                  />
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      画像をドラッグ&ドロップ、またはクリックして選択
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Google ToDo・メモアプリ・LINEなどのスクリーンショット(JPEG/PNG/WebP)
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={(e) => selectImageFile(e.target.files?.[0])}
              />
              {imageFile && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{imageFile.name}</span>
                  <Button type="button" size="sm" variant="ghost" onClick={clearImage}>
                    画像を削除
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/home")}
          >
            キャンセル
          </Button>
          {mode === "text" ? (
            <Button type="button" onClick={handleParse} disabled={parsing}>
              {parsing ? "解析中..." : "AIで解析する"}
            </Button>
          ) : (
            <Button type="button" onClick={handleParseImage} disabled={parsing || !imageFile}>
              {parsing ? "解析中..." : "AIで解析する"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {candidates.length === 0 ? (
        <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          Todoを読み取れませんでした。内容を見直してもう一度お試しください。
        </p>
      ) : (
        candidates.map((candidate) => (
          <BulkImportCandidateCard
            key={candidate.id}
            candidate={candidate}
            categories={categories}
            staff={staff}
            templates={templates}
            duplicateCandidates={duplicateCandidates}
            onChange={(patch) => updateCandidate(candidate.id, patch)}
          />
        ))
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setStep("paste")}>
          やり直す
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={submitting || candidates.length === 0}
        >
          {submitting ? "登録中..." : "選択したTodoを登録"}
        </Button>
      </div>
    </div>
  );
}
