import { redirect } from "next/navigation";

// 「商品一覧」は「商品レシピ」ページに統合したため、こちらにリダイレクトする。
export default function CostingIndexPage() {
  redirect("/costing/menu");
}
