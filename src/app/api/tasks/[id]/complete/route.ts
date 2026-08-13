import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setTaskCompletion } from "@/lib/tasks/queries";
import { logProductEvent } from "@/lib/inventory/queries";
import { countOpenSubtasks } from "@/lib/subtasks/queries";
import { getTodayDateString } from "@/lib/date";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const completed = body.completed !== false;
  const force = body.force === true;

  if (completed && !force) {
    const openCount = await countOpenSubtasks(supabase, id);
    if (openCount > 0) {
      return NextResponse.json(
        { error: "open_subtasks", openCount },
        { status: 409 },
      );
    }
  }

  const task = await setTaskCompletion(supabase, id, completed);

  // 「発注する」タスクなど、商品と紐づいたタスクを完了にしたら
  // その商品の最終発注日を自動で更新する
  if (completed && task.related_product_id) {
    await logProductEvent(
      supabase,
      task.related_product_id,
      "ordered",
      getTodayDateString(),
    );
  }

  return NextResponse.json({ task });
}
