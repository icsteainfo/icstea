import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { convertTaskToProject } from "@/lib/projects/queries";
import { convertTaskToProjectSchema } from "@/lib/validation/project";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = convertTaskToProjectSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const project = await convertTaskToProject(supabase, parsed.data);
  return NextResponse.json({ project }, { status: 201 });
}
