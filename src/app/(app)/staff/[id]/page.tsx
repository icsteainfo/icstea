import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStaffMember, listTasks } from "@/lib/tasks/queries";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { Button } from "@/components/ui/button";

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const staffMember = await getStaffMember(supabase, id);
  if (!staffMember) notFound();

  const [openTasks, completedTasks] = await Promise.all([
    listTasks(supabase, {
      assigneeType: "staff",
      assigneeStaffId: id,
      status: "open",
    }),
    listTasks(supabase, {
      assigneeType: "staff",
      assigneeStaffId: id,
      status: "completed",
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{staffMember.name}</h1>
        <Button variant="outline" render={<Link href="/staff">スタッフ一覧へ</Link>} />
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          委任中のタスク
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {openTasks.length}件
          </span>
        </h2>
        {openTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
            現在、委任しているタスクはありません
          </p>
        ) : (
          <div className="space-y-2">
            {openTasks.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          完了済み
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {completedTasks.length}件
          </span>
        </h2>
        <div className="space-y-2">
          {completedTasks.map((task) => (
            <TaskListItem key={task.id} task={task} />
          ))}
        </div>
      </section>
    </div>
  );
}
