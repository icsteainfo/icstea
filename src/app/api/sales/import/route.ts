import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decodeCsvBuffer } from "@/lib/sales/csv";
import {
  parseAirregiProductCategories,
  parseAirregiProductsCsv,
  parseAirregiSummaryCsv,
} from "@/lib/sales/importers/airregi";
import { parseUberEatsCsv } from "@/lib/sales/importers/uber-eats";
import { parseRocketNowCsv } from "@/lib/sales/importers/rocket-now";
import {
  upsertDailyChannelSales,
  upsertMenuItemSales,
} from "@/lib/sales/queries";
import type { Channel } from "@/lib/sales/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const formData = await request.formData();

  const channel = formData.get("channel") as Channel | null;
  const fileType = formData.get("fileType") as string | null;
  const date = formData.get("date") as string | null;
  const file = formData.get("file");

  if (!channel || !(file instanceof File)) {
    return NextResponse.json(
      { error: "チャネルとファイルを指定してください" },
      { status: 400 },
    );
  }

  try {
    const buffer = await file.arrayBuffer();

    if (channel === "airregi") {
      const text = decodeCsvBuffer(buffer, "shift_jis");

      if (fileType === "products") {
        if (!date) {
          return NextResponse.json(
            { error: "商品別売上CSVは対象日を指定してください" },
            { status: 400 },
          );
        }
        const categories = parseAirregiProductCategories(text);
        const rows = parseAirregiProductsCsv(text, date);
        await upsertMenuItemSales(supabase, "airregi", rows, categories);
        return NextResponse.json({ imported: rows.length });
      }

      const rows = parseAirregiSummaryCsv(text);
      await upsertDailyChannelSales(supabase, rows);
      return NextResponse.json({ imported: rows.length });
    }

    if (channel === "uber_eats") {
      const text = decodeCsvBuffer(buffer, "utf-8");
      const rows = parseUberEatsCsv(text);
      await upsertDailyChannelSales(supabase, rows);
      return NextResponse.json({ imported: rows.length });
    }

    if (channel === "rocket_now") {
      const text = decodeCsvBuffer(buffer, "utf-8");
      const rows = parseRocketNowCsv(text);
      await upsertDailyChannelSales(supabase, rows);
      return NextResponse.json({ imported: rows.length });
    }

    return NextResponse.json(
      { error: "このチャネルの取込には対応していません" },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "取込に失敗しました" },
      { status: 400 },
    );
  }
}
