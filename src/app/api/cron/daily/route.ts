import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDueRecurringInstances } from "@/lib/tasks/recurrence";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const generatedCount = await generateDueRecurringInstances(supabase);

  return NextResponse.json({ ok: true, generatedCount });
}
