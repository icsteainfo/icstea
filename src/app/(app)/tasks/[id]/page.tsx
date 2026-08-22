import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTask, listCategories, listStaff } from "@/lib/tasks/queries";
import { listProjects } from "@/lib/projects/queries";
import { listAttachments } from "@/lib/attachments/queries";
import { TaskForm } from "@/components/tasks/task-form";
import { DeleteTaskButton } from "@/components/tasks/delete-task-button";
import { SaveAsTemplateButton } from "@/components/tasks/save-as-template-button";
import { MakeRecurringButton } from "@/components/tasks/make-recurring-button";
import { ConvertToProjectButton } from "@/components/tasks/convert-to-project-button";
import { TaskFormBottomActions } from "@/components/tasks/task-form-bottom-actions";
import { AttachmentUploader } from "@/components/attachments/attachment-uploader";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { SubtaskList } from "@/components/subtasks/subtask-list";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [task, categories, staff, projects, attachments] = await Promise.all([
    getTask(supabase, id),
    listCategories(supabase),
    listStaff(supabase),
    listProjects(supabase),
    listAttachments(supabase, id),
  ]);

  if (!task) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">タスク編集</h1>
          <div className="flex flex-wrap gap-2">
            {!task.recurrence_series_id && (
              <MakeRecurringButton taskId={task.id} taskTitle={task.title} />
            )}
            <SaveAsTemplateButton taskId={task.id} taskTitle={task.title} />
            <ConvertToProjectButton
              taskId={task.id}
              taskTitle={task.title}
              subtaskCount={task.subtasks.length}
              attachmentCount={attachments.length}
            />
            <DeleteTaskButton taskId={task.id} />
          </div>
        </div>
        <TaskForm
          mode="edit"
          task={task}
          categories={categories}
          staff={staff}
          projects={projects}
          hideActions
        />
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">サブタスク</h2>
        <SubtaskList
          taskId={task.id}
          taskStatus={task.status}
          initialSubtasks={task.subtasks}
          progressOverride={task.progress_override}
          staff={staff}
        />
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">添付資料</h2>
        <AttachmentList attachments={attachments} />
        <AttachmentUploader taskId={task.id} />
      </div>

      <TaskFormBottomActions formId="task-form" submitLabel="更新" />
    </div>
  );
}
