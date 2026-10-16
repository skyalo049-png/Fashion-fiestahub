import "server-only";

import { createSessionSupabase } from "@/lib/supabase/session";

/**
 * The customer list.
 *
 * A client here is a row in `customers`, and nothing else. That sounds
 * obvious, but the tempting version of this screen — "everyone who has ever
 * typed a phone number into the lookup box" — would be built from
 * `lookup_attempts`, which records failures too. A list padded with people who
 * mistyped their own number is a list nobody trusts.
 *
 * Orders are folded in from a second bounded query rather than an embedded
 * aggregate. PostgREST's aggregate embedding changes shape between versions,
 * and a clients page that renders zeros because an embed silently returned
 * nothing is worse than one that costs an extra round trip.
 */

export type AdminClientRow = {
  id: string;
  phone: string;
  fullName: string | null;
  email: string | null;
  createdAt: string;
  orderCount: number;
  lifetimeKes: number;
  lastOrderAt: string | null;
};

export type ClientList = {
  clients: AdminClientRow[];
  total: number;
};

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

/** Cancelled orders are excluded: they were never revenue. */
const REVENUE_STATUSES = new Set([
  "paid",
  "processing",
  "shipped",
  "delivered",
]);

export async function listClients(): Promise<ClientList> {
  const supabase = await createSessionSupabase();

  const { data: customerRows, error } = await supabase
    .from("customers")
    .select("id,phone,full_name,email,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  // Not staff, or the read failed. The layout has already decided what this
  // person sees; an empty list is the honest degradation, not a throw.
  if (error || !customerRows) return { clients: [], total: 0 };

  const { data: orderRows } = await supabase
    .from("orders")
    .select("customer_id,total_kes,subtotal_kes,status,created_at")
    .limit(2000);

  const byCustomer = new Map<
    string,
    { count: number; lifetime: number; last: string | null }
  >();

  if (Array.isArray(orderRows)) {
    for (const raw of orderRows) {
      const o = raw as Record<string, unknown>;
      const id = str(o.customer_id);
      if (!id) continue;

      const entry = byCustomer.get(id) ?? { count: 0, lifetime: 0, last: null };
      entry.count += 1;

      if (REVENUE_STATUSES.has(str(o.status))) {
        // total_kes is null until delivery is quoted, so fall back to the
        // subtotal — the goods are real money even while the fee is pending.
        entry.lifetime +=
          o.total_kes === null || o.total_kes === undefined
            ? num(o.subtotal_kes)
            : num(o.total_kes);
      }

      const createdAt = str(o.created_at);
      if (createdAt && (entry.last === null || createdAt > entry.last)) {
        entry.last = createdAt;
      }

      byCustomer.set(id, entry);
    }
  }

  const clients: AdminClientRow[] = customerRows.map((raw) => {
    const c = raw as Record<string, unknown>;
    const id = str(c.id);
    const rolled = byCustomer.get(id);

    return {
      id,
      phone: str(c.phone),
      fullName: strOrNull(c.full_name),
      email: strOrNull(c.email),
      createdAt: str(c.created_at),
      orderCount: rolled?.count ?? 0,
      lifetimeKes: rolled?.lifetime ?? 0,
      lastOrderAt: rolled?.last ?? null,
    };
  });

  return { clients, total: clients.length };
}