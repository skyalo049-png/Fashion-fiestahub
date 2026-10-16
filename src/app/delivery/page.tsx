import type { Metadata } from "next";

import PolicyShell from "@/components/PolicyShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delivery",
  description:
    "How Fashion Fiesta Hub delivers: the fee is quoted by hand on WhatsApp per order, what we need from you, and how long delivery and pickup take.",
  alternates: { canonical: "/delivery" },
};

export default function DeliveryPage() {
  return (
    <PolicyShell
      title="Delivery"
      intro="We do not publish a fee table, because a fee table would be a guess. Here is exactly what happens instead, and how long it takes."
    >
      <h2>Why there is no price list here</h2>
      <p>
        Nairobi delivery is not one price. A dress to Kilimani and the same
        dress to Ngong are different trips, and a rider who charges you the
        Kilimani price for the Ngong trip is a rider who stops taking our calls.
        Rather than publish an average that is wrong for most people, we quote
        each order once we can see the address.
      </p>
      <p>
        So the honest version: <strong>the delivery fee is quoted per order, by
        a person, before you pay anything.</strong> You will always know the
        exact figure and agree to it before money moves.
      </p>

      <h2>What happens, step by step</h2>
      <ol>
        <li>
          You place the order. It costs you nothing yet — no card, no M-Pesa,
          no commitment.
        </li>
        <li>
          Your order lands with us as <strong>awaiting a delivery quote</strong>.
          Your stock is held.
        </li>
        <li>
          We WhatsApp you the delivery fee for your town and area, and the total
          to pay: your items plus that fee.
        </li>
        <li>
          You Send Money the total on M-Pesa and send us the confirmation code.
        </li>
        <li>We verify the code, confirm the order, and dispatch.</li>
      </ol>

      <h2>What we need from you</h2>
      <p>
        Town or city is required. Everything else that actually gets a rider to
        your gate goes in the delivery notes — estate, building, gate code, a
        landmark, which sacco or stage, and the best time to call. The more you
        give us here, the fewer phone calls it takes on the day.
      </p>

      <h2>How long it takes</h2>
      <table>
        <thead>
          <tr>
            <th>Where</th>
            <th>Typical time after payment is verified</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nairobi</td>
            <td>Same day, or next day if the order is confirmed late</td>
          </tr>
          <tr>
            <td>Nairobi, pickup arranged</td>
            <td>Same day, by appointment</td>
          </tr>
          <tr>
            <td>Major towns (Nakuru, Mombasa, Kisumu, Eldoret, Thika, Nyeri)</td>
            <td>1–2 working days by courier</td>
          </tr>
          <tr>
            <td>Elsewhere in Kenya</td>
            <td>2–4 working days, by courier to the nearest pickup point</td>
          </tr>
        </tbody>
      </table>
      <p>
        These are the times we work to, not a promise we can make on the
        courier&apos;s behalf. If something is going to be late we will tell you
        as soon as we know, not after you chase us.
      </p>

      <h2>Outside Kenya</h2>
      <p>
        We ship within Kenya. For anything else, WhatsApp us before ordering and
        we will tell you honestly whether it is worth doing.
      </p>

      <h2>If you do not hear from us</h2>
      <p>
        We reply to every order, usually within a few hours during working
        hours. If a quote goes unanswered for more than 48 hours we will try
        once more, then release the stock so someone else can buy it. Nothing is
        owed either way at that point, because nothing has been paid.
      </p>

      <h2>Collecting in person</h2>
      <p>
        In {site.city} you are welcome to collect instead of paying a delivery
        fee. Say so in the delivery notes and we will send you the pickup point
        and a time on WhatsApp.
      </p>
    </PolicyShell>
  );
}