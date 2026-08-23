import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logOrderEvent, logProductEvent } from "@/lib/inventory/queries";
import { getTodayDateString } from "@/lib/date";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json().catch(() => ({}));

  if (json.type !== "ordered" && json.type !== "received") {
    return NextResponse.json({ error: "不正な種類です" }, { status: 400 });
  }

  const product =
    json.type === "ordered"
      ? await logOrderEvent(supabase, id, getTodayDateString())
      : await logProductEvent(supabase, id, "received", getTodayDateString());
  return NextResponse.json({ product });
}
