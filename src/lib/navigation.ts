// 「原材料・資材」一覧などの一覧画面から開いた詳細ページで、削除・統合などの操作を終えたあと
// 呼び出し元の一覧に戻るための共通ヘルパー。ブラウザ履歴があれば戻ることで、
// 一覧側のスクロール位置・カテゴリーの開閉状態をできる限り保つ。新規タブ等で履歴が無い場合は
// fallbackPathへ通常遷移する。
export function backOrPush(
  router: { back: () => void; push: (href: string) => void; refresh: () => void },
  fallbackPath: string,
): void {
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back();
  } else {
    router.push(fallbackPath);
  }
  router.refresh();
}
