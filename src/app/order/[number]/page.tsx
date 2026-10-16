import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import OrderStatusView from "@/components/OrderStatus";
import Button, { buttonClass } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { isPayable, lookupOrder, recallOrderPhone } from "@/lib/orders";
import { site } from "@/lib/site";

/**
 * The order status page — where the confirmation screen and the WhatsApp link
 * both point.
 *
 * The credential is the order number in the path plus the phone, which is
 * posted to this route at checkout and kept in an httpOnly cookie. A customer
 * who opens this link on a different device, or after clearing cookies, is
 * shown the lookup form instead of the order. That is not a bug to paper over:
 * the order number alone must never be enough, or an unguessable number buys
 * nothing.
 *
 * `noindex` on every one of these. An order page is personal, and a search
 * engine has no business holding it.
 */

type PageProps = {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ phone?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { number } = await params;
  return {
    title: `Order ${number}`,
    description: `Status of order ${number} at ${site.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function OrderPage({ params, searchParams }: PageProps) {
  const { number } = await params;
  const { phone: phoneFromQuery } = await searchParams;
  const orderNumber = decodeURIComponent(number).trim();

  if (!orderNumber) notFound();

  // A phone in the query string is used once and then moved into the cookie by
  // the form on this page; it is not the primary channel. The cookie is what
  // survives a refresh.
  const phone = (await recallOrderPhone(orderNumber)) ?? phoneFromQuery ?? null;

  if (!phone) {
    return (
      <main className="mx-auto max-w-md px-5 pb-24 pt-16 sm:px-8">
        <p className="font-body text-[10px] uppercase tracking-[0.3em] text-champagne">
          Order status
        </p>
        <h1 className="mt-3 font-display text-2xl text-pearl sm:text-3xl">
          Order {orderNumber}
        </h1>
        <p className="mt-4 font-body text-sm font-light leading-relaxed text-pearl/50">
          Enter the phone number you used at checkout to see this order. We ask
          because the order number on its own is not a password.
        </p>

        <form method="get" className="mt-8 space-y-4">
          <Field
            label="Phone number"
            name="phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            placeholder="07XX XXX XXX"
          />
          <Button type="submit" size="lg" className="w-full">
            View order
          </Button>
        </form>

        <p className="mt-6 font-body text-[11px] font-light leading-relaxed text-pearl/35">
          Lost your order number? Check the WhatsApp message we sent when the
          order was placed, or message us and we will find it.
        </p>
      </main>
    );
  }

  const result = await lookupOrder(phone, orderNumber);

  if (!result.ok) {
    if (result.reason === "rate_limited") {
      return (
        <Message
          title="Too many attempts"
          body="For security, order lookups are limited. Wait fifteen minutes and try again, or message us on WhatsApp and we will check for you."
        />
      );
    }

    if (result.reason === "not_found") {
      return (
        <Message
          title="We could not find that order"
          body="Check the order number and the phone number against your confirmation. If you are sure both are right, message us on WhatsApp and we will trace it."
        />
      );
    }

    return (
      <Message
        title="Something went wrong"
        body="We could not load this order just now. Please refresh, or message us on WhatsApp if it keeps happening."
      />
    );
  }

  const order = result.order;

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-8">
      <header className="mb-10">
        <p className="font-body text-[10px] uppercase tracking-[0.3em] text-champagne">
          Order status
        </p>
        <h1 className="mt-3 font-display text-3xl text-pearl sm:text-4xl">
          {isPayable(order.status) ? "Ready for payment" : "Your order"}
        </h1>
      </header>

      <OrderStatusView
        orderNumber={order.orderNumber}
        phone={phone}
        status={order.status}
        subtotalKes={order.subtotalKes}
        deliveryFeeKes={order.deliveryFeeKes}
        totalKes={order.totalKes}
        createdAt={order.createdAt}
        items={order.items.map((item) => ({
          title: item.title,
          size: item.size,
          color: item.color,
          unitPriceKes: item.unitPriceKes,
          qty: item.qty,
          lineTotalKes: item.lineTotalKes,
        }))}
      />
    </main>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto max-w-md px-5 pb-24 pt-16 sm:px-8">
      <h1 className="font-display text-2xl text-pearl">{title}</h1>
      <p className="mt-4 font-body text-sm font-light leading-relaxed text-pearl/50">
        {body}
      </p>
      <Link
        href="/"
        className={buttonClass("secondary", "md", "mt-8")}
      >
        Back to the shop
      </Link>
    </main>
  );
}