import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCampaign, listCampaigns } from "@/lib/marketing/queries";
import { campaignInputSchema } from "@/lib/validation/marketing";

export async function GET() {
  const supabase = await createClient();
  const campaigns = await listCampaigns(supabase);
  return NextResponse.json({ campaigns });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = campaignInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const campaign = await createCampaign(supabase, {
    type: parsed.data.type,
    date: parsed.data.date,
    menu_item_id: parsed.data.menu_item_id ?? null,
    ad_cost: parsed.data.ad_cost ?? null,
    memo: parsed.data.memo ?? null,
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
