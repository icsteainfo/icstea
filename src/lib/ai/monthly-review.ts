import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "./client";
import type { ManagementPlan, PlLineItem } from "@/lib/monthly-review/types";

// 単純な計算・判定はコードで行い、AIは「解析・分類・提案」だけを1回で行う。
// できるだけ安価なモデル(Claude Haiku 4.5)を使用する。
const MODEL = "claude-haiku-4-5";

const plLineItemSchema = z.object({
  label: z.string(),
  amount: z.number(),
  type: z.enum(["revenue", "expense", "reference"]),
});

const plExtractResponseSchema = z.object({
  lineItems: z.array(plLineItemSchema),
});

function toJapaneseMonthLabel(month: string): string {
  const [, m] = month.split("-");
  return `${Number(m)}月`;
}

export type PlDocumentMediaType = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

// 損益計算書(P/L)の写真またはPDFを読み取り、個別の売上・費用項目を抽出する。
// 「売上総利益」「営業利益」など他項目の合計・差引で求まる小計行は含めない(集計はアプリ側で行う)。
export async function extractPlFromImage(params: {
  imageBase64: string;
  mediaType: PlDocumentMediaType;
  month: string;
}): Promise<PlLineItem[]> {
  const { imageBase64, mediaType, month } = params;
  const client = getAnthropicClient();
  const monthLabel = toJapaneseMonthLabel(month);
  const isPdf = mediaType === "application/pdf";

  const systemPrompt = `あなたは日本の茶葉専門店「icsTEA」の経理アシスタントです。
社長が損益計算書(P/L)の${isPdf ? "PDF" : "写真"}を渡すので、そこに書かれている項目と金額を読み取ってください。
この損益計算書は「${monthLabel}」分のMTG資料です。

【対象月の列を選ぶ(最重要)】
- 表が「1月・2月・…・12月」のように月ごとの列に分かれた月次推移表になっている場合は、「${monthLabel}」の列の数値だけを読み取ってください。他の月の列や、「年計」「年合計」「累計」「合計」など複数月をまとめた列の数値は絶対に使わないでください。
- 列を選ぶ前に、まず表の一番上のヘッダー行を1マスずつ確認し、どの列が「${monthLabel}」なのかを特定してから、その列を上から下へたどって数値を読んでください。列がずれると全項目の数値が誤りになるため、慎重に確認してください。
- 表が単月分の損益計算書(列が1つだけ)の場合は、その数値をそのまま「${monthLabel}」分として読み取ってください。
- どの列が「${monthLabel}」なのか判断に迷う場合は、その項目自体を含めないでください(誤った月の数値を含めるより、除外する方が安全です)。
- 数値は桁数を1桁ずつ確認して読み取ってください(似た形の数字の見間違い、桁の読み飛ばしに注意してください)。

【項目の抽出ルール】
- 資料に書かれていない項目や金額を勝手に作らないでください。読み取れない数値は無理に埋めず、その項目自体を除外してください。
- 各項目について、売上・収益に関するものは type を "revenue"、原価・経費・費用に関するものは type を "expense" にしてください。
- 「売上高合計」「当月売上原価」の行は、そのまま1項目としてそれぞれ抽出してください(売上高合計は type: "revenue"、当月売上原価は type: "expense")。売上高の内訳(商品別・チャネル別の個別売上など)や、売上原価の内訳(期首棚卸高・仕入高・期末棚卸高など)は抽出せず、この2つの合計行だけを使ってください。
- 「売上高合計」は売上原価を差し引く前の金額です。「売上総利益」(売上高合計から売上原価を引いた金額)の行と取り違えないよう、必ず「売上高合計」という項目名が書かれている行の数値を使ってください。
- 販売費及び一般管理費(人件費・地代家賃・水道光熱費など)は、内訳の個別項目をそれぞれ1項目ずつ抽出してください。
- 「営業外収益」「営業外費用」の区分(受取利息・雑収入・支払利息・雑損失など)がある場合、その内訳項目は抽出しないでください。この損益計算書では販売費及び一般管理費までを集計対象とします。
- 「固定費小計」「変動費小計」「一般管理費計」「費用計」「売上総利益」「営業利益」など、他の項目を合計・差し引きして求められる小計・合計・利益の行は含めないでください(「売上高合計」「当月売上原価」は例外として含めます)。
- 金額はマイナス表記や△・▲などの記号がついていても、revenue/expenseでは絶対値の数値として amount に入れてください(符号は type で表現するため)。

【検算用の参考値(reference)】
- 「経常利益」の行があれば、その${monthLabel}分の数値をそのまま1項目抽出してください(type: "reference")。「経常利益」の記載がなければ「営業利益」を代わりに使ってください。どちらもなければ抽出しなくてよいです。
- reference の amount だけは絶対値にせず、資料の符号(マイナス・△・▲があればマイナス)をそのまま数値の符号として amount に入れてください。`;

  const userPromptText = `添付した損益計算書の${isPdf ? "PDF" : "画像"}を読み取り、項目名・金額・区分(収益/費用/検算用の参考値)のリストを抽出してください。`;

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: userPromptText },
          mediaType === "application/pdf"
            ? {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: imageBase64 },
              }
            : {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: imageBase64 },
              },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(plExtractResponseSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("AIの応答を解析できませんでした");
  }

  return response.parsed_output.lineItems;
}

const managementPlanSchema = z.object({
  currentSituation: z.string(),
  keyIssues: z.array(z.string()),
  actionItems: z.array(z.object({ title: z.string(), detail: z.string() })),
});

// 今月の損益データ・MTG内容(と参考として過去数か月の損益データ)から、経営プランの提案を1回で生成する。
export async function generateManagementPlan(params: {
  month: string;
  plLineItems: PlLineItem[];
  meetingNotes: string;
  previousReviews: { month: string; plLineItems: PlLineItem[] }[];
}): Promise<ManagementPlan> {
  const { month, plLineItems, meetingNotes, previousReviews } = params;
  const client = getAnthropicClient();

  const systemPrompt = `あなたは日本の茶葉専門店「icsTEA」の経営アシスタントです。
毎月の損益データと、社長・経理とのMTGで話した内容をもとに、次月以降どう経営していけばよいかの提案をまとめてください。

【厳守事項】
- 渡されたデータ・MTG内容に書かれていないことを事実として断定しないでください。推測する場合は「〜と考えられます」のように推測だとわかる書き方にしてください。
- currentSituation には、損益データとMTG内容から読み取れる今月の状況を簡潔にまとめてください。
- keyIssues には、対応が必要な課題を箇条書きで挙げてください。
- actionItems には、来月以降に取り組むべき具体的なアクションを、実行しやすい単位で挙げてください(titleは短く、detailに理由や進め方を書いてください)。
- 過去の月のデータが渡されている場合は、傾向(改善・悪化しているものなど)も踏まえて提案してください。渡されていない場合は今月の情報だけで判断してください。`;

  const userPromptText = `対象月: ${month}

【今月の損益データ(個別項目、小計は含まない)】
${JSON.stringify(plLineItems)}

【MTGで話した内容】
${meetingNotes || "(記入なし)"}

【過去の月の損益データ(参考・古い順)】
${JSON.stringify(previousReviews)}`;

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPromptText }],
    output_config: {
      format: zodOutputFormat(managementPlanSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("AIの応答を解析できませんでした");
  }

  return response.parsed_output;
}
