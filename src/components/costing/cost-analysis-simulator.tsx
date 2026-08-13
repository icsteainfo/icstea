"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  costAfterPriceChange,
  costRatio,
  requiredPriceForTargetRatio,
} from "@/lib/costing/calculations";

export type SimulatorItem = {
  id: string;
  name: string;
  cost: number | null;
  listPrice: number | null;
};

export function CostAnalysisSimulator({ items }: { items: SimulatorItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  const [simulatedPrice, setSimulatedPrice] = useState("");
  const [targetRatio, setTargetRatio] = useState("");
  const [priceChangePercent, setPriceChangePercent] = useState("");

  const baseCost = selected?.cost ?? null;
  const basePrice = selected?.listPrice ?? null;
  const baseRatio = costRatio(baseCost, basePrice);

  const simulatedRatio =
    simulatedPrice === "" ? null : costRatio(baseCost, Number(simulatedPrice));

  const requiredPrice =
    targetRatio === ""
      ? null
      : requiredPriceForTargetRatio(baseCost, Number(targetRatio));

  const newCost =
    priceChangePercent === ""
      ? null
      : costAfterPriceChange(baseCost, Number(priceChangePercent));
  const newRatioAtCurrentPrice = costRatio(newCost, basePrice);

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        レシピと販売価格が登録された商品がまだありません。「商品レシピ」タブで登録すると、ここで価格を試算できます。
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>商品を選ぶ</Label>
        <Select
          items={Object.fromEntries(items.map((i) => [i.id, i.name]))}
          value={selectedId}
          onValueChange={(v: string | null) => setSelectedId(v)}
        >
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p>現在の原価: {baseCost != null ? `¥${baseCost.toFixed(1)}` : "未計算"}</p>
          <p>現在の販売価格: {basePrice != null ? `¥${basePrice}` : "未設定"}</p>
          <p>現在の原価率: {baseRatio != null ? `${baseRatio.toFixed(1)}%` : "—"}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 rounded-lg border p-4">
          <Label htmlFor="sim_price">販売価格をいくらにしたら?</Label>
          <Input
            id="sim_price"
            type="number"
            min={0}
            value={simulatedPrice}
            onChange={(e) => setSimulatedPrice(e.target.value)}
            placeholder="例: 800"
          />
          <p className="text-xs text-muted-foreground">
            原価率:{" "}
            <span className="font-semibold text-foreground">
              {simulatedRatio != null ? `${simulatedRatio.toFixed(1)}%` : "—"}
            </span>
          </p>
        </div>

        <div className="space-y-2 rounded-lg border p-4">
          <Label htmlFor="sim_ratio">目標原価率(%)以下にするには?</Label>
          <Input
            id="sim_ratio"
            type="number"
            min={0}
            max={100}
            value={targetRatio}
            onChange={(e) => setTargetRatio(e.target.value)}
            placeholder="例: 25"
          />
          <p className="text-xs text-muted-foreground">
            必要な販売価格:{" "}
            <span className="font-semibold text-foreground">
              {requiredPrice != null ? `¥${Math.ceil(requiredPrice)}以上` : "—"}
            </span>
          </p>
        </div>

        <div className="space-y-2 rounded-lg border p-4">
          <Label htmlFor="sim_change">仕入価格が何%変わったら?</Label>
          <Input
            id="sim_change"
            type="number"
            value={priceChangePercent}
            onChange={(e) => setPriceChangePercent(e.target.value)}
            placeholder="例: 10(10%値上げ)"
          />
          <p className="text-xs text-muted-foreground">
            新しい原価:{" "}
            <span className="font-semibold text-foreground">
              {newCost != null ? `¥${newCost.toFixed(1)}` : "—"}
            </span>
            {" / 新しい原価率: "}
            <span className="font-semibold text-foreground">
              {newRatioAtCurrentPrice != null
                ? `${newRatioAtCurrentPrice.toFixed(1)}%`
                : "—"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
