import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setSubtaskCompletion } from "@/lib/subtasks/queries";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const completed = body.completed !== false;

  const subtask = await setSubtaskCompletion(supabase, id, completed);
  return NextResponse.json({ subtask });
}
