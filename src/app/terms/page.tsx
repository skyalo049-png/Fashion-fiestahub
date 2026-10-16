import type { Metadata } from "next";

import PolicyShell from "@/components/PolicyShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms on which Fashion Fiesta Hub sells: prices, placing an order, M-Pesa payment, delivery, stock, liability and governing law.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PolicyShell
      title="Terms"
      intro="The agreement between you and this shop. Plain enough to check before you pay, and short enough that you might."
    >
      <h2>Who you are dealing with</h2>
      <p>
        {site.name}, {site.city}, {site.country}.
      </p>

      <h2>These terms</h2>
      <p>
        By placing an order on this site you accept these terms. If you do not
        accept them, please do not place the order.
      </p>

      <h2>Prices</h2>
      <p>
        All prices are in Kenyan shillings, in whole shillings, and cover the
        item only. Delivery is separate and is quoted per order — the{" "}
        <a href="/delivery">Delivery page</a> explains exactly how.
      </p>

      <h2>Placing an order</h2>
      <p>
        An order on this site is an offer to buy, not a completed sale. The sale
        is complete when we have confirmed your order and verified your payment.
        If an item sells out between your order and our confirmation, we will
        tell you and refund you in full.
      </p>

      <h2>Payment</h2>
      <p>
        Payment is by M-Pesa <strong>Send Money</strong> to the number we give
        you on WhatsApp. We do not use a Buy Goods till, and we will never ask
        you for your M-Pesa PIN. Your order is not confirmed until we have seen
        the M-Pesa confirmation code and matched it to your order. Nothing is
        charged at checkout.
      </p>

      <h2>Delivery</h2>
      <p>
        Delivery is arranged and priced per order. The <a href="/delivery">
          Delivery page
        </a>{" "}
        forms part of these terms. Risk in the goods passes to you when they are
        delivered.
      </p>

      <h2>Stock and availability</h2>
      <p>
        We list what we have. Your stock is reserved when your order is created.
        If you do not respond to the delivery quote within 48 hours we may
        release the reserved stock and cancel the order.
      </p>

      <h2>Returns</h2>
      <p>
        Returns are governed by the <a href="/returns">Returns page</a>, which
        forms part of these terms.
      </p>

      <h2>Your order identity</h2>
      <p>
        There is no account to create. Your order number and the phone number
        you ordered with are how you and we identify your order, including when
        you look it up on this site. Keep both.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not use this site to place fraudulent orders, to scrape it, or to
        interfere with it or with anyone else using it.
      </p>

      <h2>Our liability</h2>
      <p>
        We are responsible for delivering the item you ordered, in the condition
        described. We are not liable for indirect or consequential losses.
        Nothing in these terms limits any right you have under the Consumer
        Protection Act 2012.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of Kenya, and the courts of Kenya
        have jurisdiction over any dispute arising from them.
      </p>
    </PolicyShell>
  );
}