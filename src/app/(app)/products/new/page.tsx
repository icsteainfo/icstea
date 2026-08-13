import { ProductForm } from "@/components/inventory/product-form";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">商品追加</h1>
      <ProductForm mode="create" />
    </div>
  );
}
