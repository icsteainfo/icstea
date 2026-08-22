import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProject, listProjects } from "@/lib/projects/queries";
import { projectInputSchema } from "@/lib/validation/project";
import type { ProjectPhase } from "@/types/database.types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const params = request.nextUrl.searchParams;

  const projects = await listProjects(supabase, {
    phase: (params.get("phase") as ProjectPhase) || undefined,
  });

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const json = await request.json();
  const parsed = projectInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const project = await createProject(supabase, parsed.data);
  return NextResponse.json({ project }, { status: 201 });
}
