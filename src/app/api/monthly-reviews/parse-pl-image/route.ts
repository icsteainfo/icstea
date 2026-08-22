import { NextResponse, type NextRequest } from "next/server";
import { extractPlFromImage } from "@/lib/ai/monthly-review";
import { monthlyReviewParseImageRequestSchema } from "@/lib/validation/monthly-review";

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = monthlyReviewParseImageRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const lineItems = await extractPlFromImage({
    imageBase64: parsed.data.imageBase64,
    mediaType: parsed.data.mediaType,
    month: parsed.data.month,
  });

  return NextResponse.json({ lineItems });
}
