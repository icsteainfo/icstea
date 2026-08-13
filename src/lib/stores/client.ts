import "server-only";

// STORES APIドキュメント(202211): https://github.com/heyinc/retail-api-docs
const BASE_URL = "https://api.stores.dev";
const API_VERSION = "202211";

export type StoresDelivery = {
  id: string;
  type: "shipping" | "counter" | "download" | "ticket" | "unknown";
  shipped_at: string | null;
  shipping_address?: {
    first_name: string;
    last_name: string;
  } | null;
};

export type StoresOrder = {
  id: string;
  number: string;
  email: string | null;
  payment_amount: number;
  ordered_at: string;
  note: string;
  remarks: string;
  deliveries: StoresDelivery[];
};

type FetchOrdersParams = {
  deliveryStatus?: "waiting" | "shipped";
  ids?: string;
  limit?: number;
  offset?: number;
};

async function storesFetch(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<unknown> {
  const apiKey = process.env.STORES_API_KEY;
  if (!apiKey) throw new Error("STORES_API_KEY が設定されていません");

  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`STORES APIエラー (${res.status}): ${body}`);
  }
  return res.json();
}

async function fetchOrdersPage(
  params: FetchOrdersParams,
): Promise<StoresOrder[]> {
  const { deliveryStatus, ids, limit = 100, offset = 0 } = params;
  const data = (await storesFetch(`/retail/${API_VERSION}/orders`, {
    delivery_status: deliveryStatus,
    ids,
    limit,
    offset,
  })) as { orders: StoresOrder[] };
  return data.orders;
}

// 未発送(発送待ち)の注文を全件取得する。100件ずつページングする。
export async function fetchAllUnshippedOrders(): Promise<StoresOrder[]> {
  const all: StoresOrder[] = [];
  const limit = 100;
  let offset = 0;
  for (;;) {
    const page = await fetchOrdersPage({
      deliveryStatus: "waiting",
      limit,
      offset,
    });
    all.push(...page);
    if (page.length < limit) break;
    offset += limit;
  }
  return all;
}

// 指定した注文IDのうち、発送済みになっているものを判定する。
export async function fetchShippedOrderIds(
  orderIds: string[],
): Promise<Set<string>> {
  if (orderIds.length === 0) return new Set();

  const shippedIds = new Set<string>();
  // STORES APIのids指定は件数が多くなりすぎないよう、50件ずつに分割して問い合わせる
  const chunkSize = 50;
  for (let i = 0; i < orderIds.length; i += chunkSize) {
    const chunk = orderIds.slice(i, i + chunkSize);
    const page = await fetchOrdersPage({
      deliveryStatus: "shipped",
      ids: chunk.join(","),
      limit: chunkSize,
    });
    for (const order of page) shippedIds.add(order.id);
  }
  return shippedIds;
}
