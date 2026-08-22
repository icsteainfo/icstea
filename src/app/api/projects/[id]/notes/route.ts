import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProjectNote } from "@/lib/projects/queries";
import { projectNoteInputSchema } from "@/lib/validation/project";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const json = await request.json();
  const parsed = projectNoteInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const note = await createProjectNote(supabase, id, parsed.data);
  return NextResponse.json({ note }, { status: 201 });
}
