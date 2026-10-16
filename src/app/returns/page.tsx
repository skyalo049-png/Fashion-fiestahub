import PolicyShell from "@/components/PolicyShell";
import { site } from "@/lib/site";

export const metadata = {
  title: "Returns and exchanges",
  description:
    "Seven days, unworn, tags still on. How to send something back, who pays the return delivery, and how a refund reaches you on M-Pesa.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <PolicyShell
      title="Returns and exchanges"
      intro="Seven days, unworn, tags still on. If a piece is not right, WhatsApp us with your order number and we will sort it out — the awkward part is ours to carry, not yours."
    >
      <h2>The short version</h2>
      <p>
        You have <strong>seven days from the day your order is delivered</strong>{" "}
        to tell us something is going back. It must be unworn, unwashed, and
        still carrying its tags. Message us on WhatsApp with your order number
        and we will tell you exactly where to send it and who to send it with.
      </p>

      <h2>What we can take back</h2>
      <ul>
        <li>An item that does not fit, in the size you ordered.</li>
        <li>
          An item that is not what you expected — the colour or cut reads
          differently on you than it did on the page.
        </li>
        <li>An item that arrived faulty, damaged, or marked.</li>
        <li>
          An item you were sent by mistake, which is a different thing from an
          item you changed your mind about.
        </li>
      </ul>
      <p>
        In every case the item must come back unworn and unwashed, with the tags
        still attached and in the condition it arrived in.
      </p>

      <h2>What we cannot take back</h2>
      <ul>
        <li>Anything worn outside, washed, soaked, or sprayed with perfume.</li>
        <li>Anything with the tags cut off or the packaging discarded.</li>
        <li>
          Made-to-measure and custom pieces, because they were cut for you and
          cannot be sold to anyone else.
        </li>
        <li>
          Earrings and intimates, for hygiene reasons. This is a rule we cannot
          bend, and we would rather say so plainly now than argue about it
          later.
        </li>
        <li>
          Anything you tell us about after the seven days have passed. We hold
          to the window because after that the trail goes cold — but if
          something is genuinely wrong, tell us anyway and we will look at it.
        </li>
      </ul>

      <h2>If the fault is ours</h2>
      <p>
        A faulty item, a damaged parcel, or the wrong thing entirely is our
        mistake and we pay for it. Send us a photo on WhatsApp showing what
        arrived. We cover the return delivery and the replacement delivery, and
        you choose between a replacement and a full refund.
      </p>

      <h2>If you changed your mind or the size is wrong</h2>
      <p>
        You pay the return delivery, and we pay to send the replacement out.
        Tell us your order number and the size you actually need. If we have it
        in stock we will hold it for you the moment you tell us, so it does not
        sell while the parcel is on its way back. If we do not have it, the
        return becomes a refund.
      </p>

      <h2>How a refund is paid</h2>
      <p>
        Refunds go back to the M-Pesa number that paid for the order, and to
        nobody else. We process the refund within{" "}
        <strong>three working days</strong> of the item reaching us and passing
        a quick check. If you paid by a method other than M-Pesa, tell us and we
        will arrange the return by the same route.
      </p>
      <p>
        Delivery fees you already paid are only refunded when the return is our
        fault. If you changed your mind, the original delivery fee is not
        refunded — that trip already happened.
      </p>

      <h2>Exchanges</h2>
      <p>
        A size exchange is a return and a new order in one movement. Message us
        first so we can hold the size you want; sending something back before
        checking means you may be sending it back for a size we no longer have.
      </p>

      <h2>Collecting in person</h2>
      <p>
        If you collected your order at our {site.city} pickup point, you can
        bring a return back to the same place by arrangement. Message us first
        so somebody is there to receive it.
      </p>

      <h2>If something has gone wrong with a return</h2>
      <p>
        If you have sent something back and have not heard from us within two
        working days of it being delivered, chase us. Do not assume we have
        decided not to refund you — parcels go missing and messages get buried,
        and both are fixable once we know.
      </p>
    </PolicyShell>
  );
}