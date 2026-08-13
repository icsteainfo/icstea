import "server-only";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "./client";
import {
  bulkImportResponseSchema,
  type BulkImportCandidate,
} from "@/lib/validation/bulk-import";
import { findSimilarTasks } from "@/lib/tasks/similarity";
import { getTodayDateString } from "@/lib/date";

// 単純な計算・判定はコードで行い、AIは「解析・分類・提案」だけを1回で行う。
// できるだけ安価なモデル(Claude Haiku 4.5)を使用する。
const MODEL = "claude-haiku-4-5";

export type BulkImportDuplicateCandidate = { id: string; title: string };

export type BulkImportParseResult = {
  candidates: BulkImportCandidate[];
  duplicateCandidatesConsidered: BulkImportDuplicateCandidate[];
};

export async function parseBulkTodos(params: {
  text: string;
  categories: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  templates: {
    id: string;
    name: string;
    categoryName: string | null;
    subtaskTitles: string[];
  }[];
  openTasks: BulkImportDuplicateCandidate[];
}): Promise<BulkImportParseResult> {
  const { text, categories, staff, templates, openTasks } = params;

  // 既存タスクを毎回すべてAIに渡すとタスクが増えるほど費用が膨らむため、
  // まず文章と似ているものだけをプログラム側で少数に絞り込み、その中からAIに最終判断させる。
  const duplicateCandidates = findSimilarTasks(text, openTasks, { limit: 10 });

  const client = getAnthropicClient();

  const systemPrompt = `あなたは日本の茶葉専門店「icsTEA」の業務管理アシスタントです。
オーナーがChatGPTなどでまとめたTodoの文章を渡すので、タスク管理アプリに登録するための候補データに変換してください。

【厳守事項】
- 文章に書かれていない情報を勝手に作らないでください。
- 期限が書かれていない場合は dueDate を null にしてください。
- 担当者が書かれていない場合は assigneeStaffId を null にしてください(自分が担当という意味になります)。
- カテゴリーは、渡されたカテゴリー一覧の中から内容に最も合うものを1つ選び、その id を categoryId に入れてください。どれも合わない場合は null にしてください。
- 担当者が文章に書かれていて、渡されたスタッフ一覧の中に一致する名前があれば、その id を assigneeStaffId にしてください。
- 渡されたテンプレート一覧の中に、大項目の内容とよく合うものがあれば、その id を templateId にしてください。合うものがなければ null にしてください。
- 渡された「重複チェック対象の既存タスク」の中に、この大項目と同じ、または似た内容のものがあれば、その id を duplicateTaskIds に入れてください。なければ空配列にしてください。
- 文章のかたまり(大項目名の下に箇条書きがある場合など)ごとに1つの候補にまとめ、箇条書きはサブタスクにしてください。
- 箇条書きに完了マーク(「済み」「✓」「完了」など)が明記されている場合のみ completed を true にしてください。書かれていなければ false にしてください。
- 優先度(priority)は urgent/high/medium/low のいずれかを、文章の緊急度から判断してください。特に手がかりがなければ medium にしてください。`;

  const userPrompt = `今日の日付: ${getTodayDateString()}

【カテゴリー一覧】
${JSON.stringify(categories)}

【スタッフ一覧】
${JSON.stringify(staff)}

【テンプレート一覧】
${JSON.stringify(templates)}

【重複チェック対象の既存タスク(この一覧以外の既存タスクは考慮しなくてよい)】
${JSON.stringify(duplicateCandidates)}

【貼り付けられたTodo文章】
${text}`;

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    output_config: {
      format: zodOutputFormat(bulkImportResponseSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("AIの応答を解析できませんでした");
  }

  return {
    candidates: response.parsed_output.candidates,
    duplicateCandidatesConsidered: duplicateCandidates,
  };
}

// Google ToDoやメモアプリ、LINEのメモなどのスクリーンショット・画像からTodo候補を抽出する。
// 画像の内容だけからは事前の文字列絞り込みができないため、重複チェックは既存の未完了タスク全件を
// AIに渡して判断させる(文章版のようなコード側の事前フィルタリングは行わない)。
export async function parseBulkTodosFromImage(params: {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  categories: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  templates: {
    id: string;
    name: string;
    categoryName: string | null;
    subtaskTitles: string[];
  }[];
  openTasks: BulkImportDuplicateCandidate[];
}): Promise<BulkImportParseResult> {
  const { imageBase64, mediaType, categories, staff, templates, openTasks } = params;

  const client = getAnthropicClient();

  const systemPrompt = `あなたは日本の茶葉専門店「icsTEA」の業務管理アシスタントです。
オーナーが、Google ToDoやメモアプリ、LINEに送った自分宛メモなどのスクリーンショット・画像を渡すので、その画像に写っている内容を読み取り、タスク管理アプリに登録するための候補データに変換してください。

【厳守事項】
- 画像に書かれていない情報を勝手に作らないでください。画像に写っていないことは推測しないでください。
- 期限が書かれていない場合は dueDate を null にしてください。
- 担当者が書かれていない場合は assigneeStaffId を null にしてください(自分が担当という意味になります)。
- カテゴリーは、渡されたカテゴリー一覧の中から内容に最も合うものを1つ選び、その id を categoryId に入れてください。どれも合わない場合は null にしてください。
- 担当者が画像に書かれていて、渡されたスタッフ一覧の中に一致する名前があれば、その id を assigneeStaffId にしてください。
- 渡されたテンプレート一覧の中に、大項目の内容とよく合うものがあれば、その id を templateId にしてください。合うものがなければ null にしてください。
- 渡された「重複チェック対象の既存タスク」の中に、この大項目と同じ、または似た内容のものがあれば、その id を duplicateTaskIds に入れてください。なければ空配列にしてください。
- 画像内で見出しの下に箇条書き・チェックリストが並んでいるなど、関連性が明確なものだけを大項目+サブタスクとしてまとめてください。関連性がはっきりしない項目同士を勝手にまとめないでください。
- チェックがついている・取り消し線があるなど、完了を示す表現が画像上で明確な項目のみ completed を true にしてください。
- 優先度(priority)は urgent/high/medium/low のいずれかを、画像内の手がかり(色・マーク・強調表示など)から判断してください。特に手がかりがなければ medium にしてください。
- スクリーンショットのアプリのUI部品(時刻表示・バッテリー残量・アイコン・ステータスバーなど)はTodoの内容として扱わないでください。`;

  const userPromptText = `今日の日付: ${getTodayDateString()}

【カテゴリー一覧】
${JSON.stringify(categories)}

【スタッフ一覧】
${JSON.stringify(staff)}

【テンプレート一覧】
${JSON.stringify(templates)}

【重複チェック対象の既存タスク(この一覧以外の既存タスクは考慮しなくてよい)】
${JSON.stringify(openTasks)}

添付した画像を読み取り、Todoの登録候補を抽出してください。`;

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: userPromptText },
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(bulkImportResponseSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("AIの応答を解析できませんでした");
  }

  return {
    candidates: response.parsed_output.candidates,
    duplicateCandidatesConsidered: openTasks,
  };
}
