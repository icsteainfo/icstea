import { redirect } from "next/navigation";

// 「在庫」は「原材料・資材」ページに統合したため、こちらにリダイレクトする。
export default function InventoryPage() {
  redirect("/costing/materials");
}
