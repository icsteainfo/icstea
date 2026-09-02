import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// /api/cronはVercel Cronからログインセッションなしで呼ばれるため、
// ここでは素通しし、ルート側でCRON_SECRETによる認証を行う
const PUBLIC_PATHS = ["/login", "/api/cron"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser()/getClaims()は検証のためAuthサーバーへネットワークリクエストを送りうる
  // (本プロジェクトは非対称鍵だがJWKSのキャッシュはサーバーレス関数のインスタンスが
  // 使い回されないと効かず、結局ほぼ毎回ネットワーク往復が発生し遷移のたびに遅延していた)。
  // ここはログイン画面へのリダイレクト判定のための楽観的チェックに留め、cookieの
  // セッションをネットワーク不要で読むだけのgetSession()を使う。実際のデータアクセスの
  // 安全性はSupabaseのRLS(行レベルセキュリティ)がクエリのたびに検証しているため、
  // ここで署名検証を省いても安全性は損なわれない(Next.js公式が推奨するパターン)。
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const homeUrl = new URL("/home", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // "/"はpage.tsx側でredirect("/home")していたが、それだと
  // 「/を取得→home へリダイレクト→home を取得」と往復が2回になり、
  // アプリを開くたびに白画面の時間が余計に伸びていた。ここで直接
  // リダイレクトして往復を1回にする。
  if (user && request.nextUrl.pathname === "/") {
    const homeUrl = new URL("/home", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}
