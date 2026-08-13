// 依存ライブラリを増やさず、この用途に必要な範囲だけをカバーする簡易CSVパーサー。
// ダブルクォートで囲まれたフィールド(内部にカンマ・改行を含む場合)にも対応する。
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      pushField();
    } else if (c === "\n") {
      pushRow();
    } else if (c === "\r") {
      // 改行はLFのみで扱う(CRLFのCRは無視)
    } else {
      field += c;
    }
  }

  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

// AirレジのCSVはShift-JISで書き出されるため、UTF-8として読むと文字化けする。
// Node.jsのTextDecoderは(フルICUビルドであれば)shift_jisに対応している。
export function decodeCsvBuffer(buffer: ArrayBuffer, encoding: "shift_jis" | "utf-8"): string {
  if (encoding === "utf-8") {
    // UTF-8 BOM付きのファイルにも対応(BOMは自動的に除去される)
    return new TextDecoder("utf-8").decode(buffer);
  }
  return new TextDecoder("shift_jis").decode(buffer);
}

export function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}
