import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteCampaign } from "@/lib/marketing/queries";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  await deleteCampaign(supabase, id);
  return NextResponse.json({ ok: true });
}
