import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mergeProducts } from "@/lib/costing/merge-queries";
import { mergeProductSchema } from "@/lib/validation/product";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json().catch(() => ({}));
  const parsed = mergeProductSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  if (parsed.data.targetProductId === id) {
    return NextResponse.json({ error: "統合先に自分自身は選べません" }, { status: 400 });
  }

  const result = await mergeProducts(supabase, id, parsed.data.targetProductId);
  if (!result.ok) {
    return NextResponse.json(
      { error: "統合中に参照が新しく発生したため中断しました。ページを更新して再度お試しください。", usage: result.usage },
      { status: 409 },
    );
  }

  return NextResponse.json(result);
}
