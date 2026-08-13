import { createClient } from "@/lib/supabase/server";
import { listStaff } from "@/lib/tasks/queries";
import { NameListManager } from "@/components/settings/name-list-manager";

export default async function StaffPage() {
  const supabase = await createClient();
  const staff = await listStaff(supabase);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">スタッフ</h1>
      <NameListManager
        apiBasePath="/api/staff"
        items={staff}
        addPlaceholder="新しいスタッフ名"
        deleteConfirmLabel="削除しても、このスタッフが担当のタスクはそのまま残ります。新規のタスクでは選択できなくなります。"
        linkPrefix="/staff"
      />
    </div>
  );
}
