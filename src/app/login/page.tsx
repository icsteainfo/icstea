import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>icsTEA 経営アシスタント</CardTitle>
          <CardDescription>オーナー用アカウントでログインしてください</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" name="email" type="email" required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && (
              <p className="text-sm text-destructive">
                ログインに失敗しました。メールアドレスとパスワードをご確認ください。
              </p>
            )}
            <Button type="submit" className="w-full">
              ログイン
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
