// Googleスプレッドシート「在庫管理」タブの上側にある「定期在庫チェック」表
// (商品名・必要な在庫数・◎/×判定・足りない場合の在庫数・メモ)を読み取るパース処理。
// 同じタブの72行目以降には別の表(茶葉専用の詳細在庫表)があるため、そこに達したら読み取りを止める。
// 列の位置は固定せず、見出し行にある「足りない場合の在庫数」という文字を目印にして
// 毎回位置を特定する(列がずれても壊れにくくするため)。

export type ParsedInventoryCheckRow = {
  name: string;
  required: string;
  judgment: string;
  current: string;
  memo: string;
};

const TEA_TABLE_MARKER = "茶葉"; // 72行目以降の茶葉詳細在庫表の先頭にある見出し文字

function cellText(row: unknown[], index: number): string {
  const value = row[index];
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

export function parseInventoryCheckRows(rows: unknown[][]): ParsedInventoryCheckRow[] {
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => String(cell ?? "").includes("足りない場合")),
  );
  if (headerIndex === -1) {
    throw new Error(
      "「在庫管理」シートで見出し行(「足りない場合の在庫数」列)が見つかりませんでした。シートの構成が変わっていないか確認してください",
    );
  }
  const headerRow = rows[headerIndex];
  const currentCol = headerRow.findIndex((cell) => String(cell ?? "").includes("足りない場合"));
  const judgmentCol = currentCol - 1;
  const requiredCol = currentCol - 2;
  const nameCol = 0;

  const results: ParsedInventoryCheckRow[] = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const name = cellText(row, nameCol);
    if (name === TEA_TABLE_MARKER) break; // ここから下は茶葉専用の詳細在庫表なので対象外

    const judgment = cellText(row, judgmentCol);
    if (!name || !judgment) continue; // セクション見出し行(食品系・備品系など)や空行はスキップ

    const memo = row
      .slice(currentCol + 1)
      .map((cell) => String(cell ?? "").trim())
      .filter(Boolean)
      .join(" / ");

    results.push({
      name,
      required: cellText(row, requiredCol),
      judgment,
      current: cellText(row, currentCol),
      memo,
    });
  }
  return results;
}

// 商品名の括弧書き(置き場所メモなど)を取り除いた、Todoのタイトルや商品マスタ登録に使う名前。
// 例: 「紙袋大（冷凍庫上棚、シルバー棚、ロフト）」→「紙袋大」
export function cleanProductName(rawName: string): string {
  const stripped = rawName.replace(/[（(][^）)]*[）)]/g, "").replace(/\s+/g, " ").trim();
  return stripped || rawName.trim();
}

// 「30個」「1.2kg」のような単純な数値+単位だけを抜き出す。
// 「約60本」「6束(約150枚)」のような曖昧・複合表現は対象外(nullを返す)。
export function extractCleanNumber(text: string): { value: number; unit: string } | null {
  const match = text.trim().match(/^(\d+(?:\.\d+)?)\s*([^\d\s.]*)$/);
  if (!match) return null;
  return { value: Number(match[1]), unit: match[2] ?? "" };
}

// 必要在庫・現在在庫の両方が単純な数値+同じ単位のときだけ、不足数を計算する。
// (AIで無理に解釈せず、はっきり数値化できる場合のみ計算するというルール)
export function computeShortage(requiredText: string, currentText: string): number | null {
  const required = extractCleanNumber(requiredText);
  const current = extractCleanNumber(currentText);
  if (!required || !current) return null;
  if (required.unit !== current.unit) return null;
  const shortage = required.value - current.value;
  return shortage > 0 ? shortage : 0;
}
