import "server-only";
import { google } from "googleapis";

// スプレッドシート連携はすべてサーバー側のみで行う(サービスアカウントの秘密鍵を
// クライアントに絶対に渡さないため)。
export function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

export async function fetchSheetRange(range: string): Promise<unknown[][]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  return data.values ?? [];
}

// 指定範囲のセルの背景色を、行×列の配列(16進カラーコード、白や未設定はnull)で取得する。
// アプリの画面をスプレッドシートの色分けと揃えるために使う。
export async function fetchCellBackgroundColors(range: string): Promise<(string | null)[][]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

  const { data } = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: [range],
    fields: "sheets.data.rowData.values.userEnteredFormat.backgroundColor",
  });

  const rowData = data.sheets?.[0]?.data?.[0]?.rowData ?? [];
  return rowData.map((row) =>
    (row.values ?? []).map((cell) => {
      const bg = cell.userEnteredFormat?.backgroundColor;
      if (!bg) return null;
      const r = Math.round((bg.red ?? 0) * 255);
      const g = Math.round((bg.green ?? 0) * 255);
      const b = Math.round((bg.blue ?? 0) * 255);
      if (r >= 254 && g >= 254 && b >= 254) return null; // 白は色分けなしとして扱う
      return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
    }),
  );
}
