import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listRecipeCategoryDefaults } from "@/lib/costing/category-defaults-queries";

export async function GET() {
  const supabase = await createClient();
  const defaults = await listRecipeCategoryDefaults(supabase);
  return NextResponse.json({ defaults });
}
