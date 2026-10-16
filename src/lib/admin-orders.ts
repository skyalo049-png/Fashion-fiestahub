import "server-only";

import { createSessionSupabase } from "@/lib/supabase/session";

/**
 * Staff-side order reads.
 *
 * admin_list_orders() and admin_order_detail() both return jsonb, which
 * PostgREST types as `Json`. Everything below therefore parses defensively —
 * the same approach lookup_order takes on the customer side. A field that is
 * missing becomes null and the screen still renders, rather than `undefined`
 * reaching a formatter and throwing on a page staff open under time pressure.
 */

export type AdminOrderRow = {
  orderNumber: string;
  status: string;
  subtotalKes: number;
  deliveryFeeKes: number | null;
  totalKes: number | null;
  mpesaCode: string | null;
  createdAt: string;
  reservationExpiresAt: string | null;
  fullName: string;
  phone: string;
  city: string | null;
  itemCount: number;
};

export type AdminOrderItem = {
  title: string;
  sku: string;
  size: string | null;
  color: string | null;
  unitPriceKes: number;
  qty: number;
  lineTotalKes: number;
};

export type AdminOrderEvent = {
  type: string;
  actor: string;
  payload: Record<string, unknown> | null;
  visibleToCustomer: boolean;
  createdAt: string;
};

export type AdminOrderDetail = {
  orderNumber: string;
  status: string;
  subtotalKes: number;
  deliveryFeeKes: number | null;
  totalKes: number | null;
  notes: string | null;
  mpesaCode: string | null;
  paymentPhone: string | null;
  paymentSubmittedAt: string | null;
  paymentVerifiedAt: string | null;
  reservationExpiresAt: string | null;
  createdAt: string;
  customer: {
    fullName: string;
    phone: string;
    email: string | null;
    city: string | null;
  };
  items: AdminOrderItem[];
  events: AdminOrderEvent[];
};

export type OrderCounts = Record<string, number>;

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const numOrNull = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : num(v);

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

const strOrNull = (v: unknown): string | null =>
  typeof v === "string" && v !== "" ? v : null;

function parseRow(raw: unknown): AdminOrderRow {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    orderNumber: str(r.order_number),
    status: str(r.status),
    subtotalKes: num(r.subtotal_kes),
    deliveryFeeKes: numOrNull(r.delivery_fee_kes),
    totalKes: numOrNull(r.total_kes),
    mpesaCode: strOrNull(r.mpesa_code),
    createdAt: str(r.created_at),
    reservationExpiresAt: strOrNull(r.reservation_expires_at),
    fullName: str(r.full_name, "—"),
    phone: str(r.phone),
    city: strOrNull(r.city),
    itemCount: num(r.item_count),
  };
}

export async function listOrders(status?: string): Promise<{
  orders: AdminOrderRow[];
  counts: OrderCounts;
}> {
  const supabase = await createSessionSupabase();

  const { data, error } = await supabase.rpc("admin_list_orders", {
    // undefined, not null: the generated arg type is string | undefined, and
    // null is a different thing to PostgREST than an argument that was left out.
    p_status: status && status !== "all" ? status : undefined,
    p_limit: 100,
    p_offset: 0,
  });

  // A signed-in non-staff user gets not_staff here. That is not an error state
  // to render on the list — the layout has already decided they see the gate —
  // so it degrades to an empty queue rather than throwing.
  if (error || !data) return { orders: [], counts: {} };

  const payload = data as unknown as {
    orders?: unknown[];
    counts?: Record<string, unknown>;
  };

  const orders = Array.isArray(payload.orders) ? payload.orders.map(parseRow) : [];
  const counts: OrderCounts = {};
  for (const [key, value] of Object.entries(payload.counts ?? {})) {
    counts[key] = num(value);
  }

  return { orders, counts };
}

function parseDetail(raw: unknown): AdminOrderDetail | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!r.order_number) return null;

  const c = (r.customer ?? {}) as Record<string, unknown>;

  const items: AdminOrderItem[] = Array.isArray(r.items)
    ? r.items.map((entry) => {
        const i = (entry ?? {}) as Record<string, unknown>;
        return {
          title: str(i.title),
          sku: str(i.sku),
          size: strOrNull(i.size),
          color: strOrNull(i.color),
          unitPriceKes: num(i.unit_price_kes),
          qty: num(i.qty),
          lineTotalKes: num(i.line_total_kes),
        };
      })
    : [];

  const events: AdminOrderEvent[] = Array.isArray(r.events)
    ? r.events.map((entry) => {
        const e = (entry ?? {}) as Record<string, unknown>;
        return {
          type: str(e.type),
          actor: str(e.actor),
          payload:
            e.payload && typeof e.payload === "object"
              ? (e.payload as Record<string, unknown>)
              : null,
          visibleToCustomer: e.visible_to_customer === true,
          createdAt: str(e.created_at),
        };
      })
    : [];

  return {
    orderNumber: str(r.order_number),
    status: str(r.status),
    subtotalKes: num(r.subtotal_kes),
    deliveryFeeKes: numOrNull(r.delivery_fee_kes),
    totalKes: numOrNull(r.total_kes),
    notes: strOrNull(r.notes),
    mpesaCode: strOrNull(r.mpesa_code),
    paymentPhone: strOrNull(r.payment_phone),
    paymentSubmittedAt: strOrNull(r.payment_submitted_at),
    paymentVerifiedAt: strOrNull(r.payment_verified_at),
    reservationExpiresAt: strOrNull(r.reservation_expires_at),
    createdAt: str(r.created_at),
    customer: {
      fullName: str(c.full_name, "—"),
      phone: str(c.phone),
      email: strOrNull(c.email),
      city: strOrNull(c.city),
    },
    items,
    events,
  };
}

export async function getOrderDetail(
  orderNumber: string,
): Promise<AdminOrderDetail | null> {
  const supabase = await createSessionSupabase();

  const { data, error } = await supabase.rpc("admin_order_detail", {
    p_order_number: orderNumber,
  });

  if (error || !data) return null;
  return parseDetail(data);
}
