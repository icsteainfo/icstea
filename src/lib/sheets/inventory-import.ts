import "server-only";
import { fetchCellBackgroundColors, fetchSheetRange } from "./client";

export type SheetStockRow = {
  name: string;
  quantity: number;
  kitchenBack: number | null;
  underChair: number | null;
  office: number | null;
  warehouse: number | null;
  color: string | null;
};

// 列: A=商品名 B=キッチン後ろ C=椅子下 D=店合計(未使用) E=事務所 F=倉庫 G=メモ(未使用) H=総量
const COL = {
  name: 0,
  kitchenBack: 1,
  underChair: 2,
  office: 4,
  warehouse: 5,
  total: 7,
};

function toNumberOrNull(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

// 「商品名があり、かつ総量が数値になっている行」だけを商品として扱う。
// これにより「茶葉」のような見出し行や、空行は自動的に無視される。
// colorsは行ごとの背景色(A列)の配列。渡されない場合はcolorを付けない。
export function parseTeaStockRows(
  rows: unknown[][],
  colors?: (string | null)[][],
): SheetStockRow[] {
  const results: SheetStockRow[] = [];

  rows.forEach((row, index) => {
    const name = row[COL.name];
    const total = row[COL.total];

    if (typeof name !== "string" || !name.trim()) return;
    if (typeof total !== "number") return;

    results.push({
      name: name.trim(),
      quantity: total,
      kitchenBack: toNumberOrNull(row[COL.kitchenBack]),
      underChair: toNumberOrNull(row[COL.underChair]),
      office: toNumberOrNull(row[COL.office]),
      warehouse: toNumberOrNull(row[COL.warehouse]),
      color: colors?.[index]?.[COL.name] ?? null,
    });
  });

  return results;
}

export async function fetchTeaStockFromSheet(): Promise<SheetStockRow[]> {
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME ?? "在庫管理";
  const range = `'${sheetName}'!A72:H200`;
  const [rows, colors] = await Promise.all([
    fetchSheetRange(range),
    fetchCellBackgroundColors(range),
  ]);
  return parseTeaStockRows(rows, colors);
}
