import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncStoresOrders } from "@/lib/stores/queries";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { createdCount, completedCount } = await syncStoresOrders(supabase);

  return NextResponse.json({ ok: true, createdCount, completedCount });
}
