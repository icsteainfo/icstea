import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// service-roleキーを使う特別なクライアント。RLSを無視して全操作できるため、
// cronジョブなどサーバー専用のコードからのみ呼び出すこと。
// クライアント(ブラウザ)に露出するコードから絶対にimportしないこと。
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
