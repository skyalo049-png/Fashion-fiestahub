import type { Metadata } from "next";

import PolicyShell from "@/components/PolicyShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Fashion Fiesta Hub holds about you, why we hold it, who else sees it, and how to have it corrected or deleted under the Kenya Data Protection Act 2019.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PolicyShell
      title="Privacy"
      intro="What we hold about you, why we hold it, who else sees it, and how to have it changed or removed. Written to be read, not to be survived."
    >
      <h2>Who we are</h2>
      <p>
        {site.name} is a ladies fashion shop in {site.city}, {site.country}. We
        are the data controller for everything described on this page. The
        quickest way to reach us is WhatsApp, on the number in the header of
        this site.
      </p>

      <h2>The short version</h2>
      <p>
        We collect what we need to sell you a dress and get it to you. We do not
        sell your information, we do not run advertising trackers, and we do not
        keep a mailing list.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Your name, so we know who the parcel is for.</li>
        <li>
          Your phone number. This is also how you find your order: order number
          plus phone.
        </li>
        <li>Your email address, if you choose to give it. It is optional.</li>
        <li>
          Your town, and any delivery notes you write — estate, gate code,
          landmark, the best time to call.
        </li>
        <li>What you ordered, and what you paid for it.</li>
        <li>
          The M-Pesa confirmation code you send us as proof of payment.
        </li>
      </ul>

      <h2>What we never see</h2>
      <p>
        <strong>We never see your M-Pesa PIN.</strong> Payment is a Send Money
        transfer you make from your own handset to our number; the PIN is
        entered on your phone and never reaches us. We do not receive your
        M-Pesa statement, your balance, or any other transaction of yours.
      </p>

      <h2>Why we hold it</h2>
      <ul>
        <li>To take, confirm and fulfil your order.</li>
        <li>To work out and arrange your delivery.</li>
        <li>To verify your payment.</li>
        <li>To handle a return or an exchange.</li>
        <li>
          To keep the sales records Kenyan tax law requires us to keep.
        </li>
      </ul>

      <h2>Our lawful basis</h2>
      <p>
        Under the Data Protection Act 2019 we rely on three grounds. Performance
        of a contract, for anything needed to complete your order. Legal
        obligation, for our tax and accounting records. Legitimate interest, for
        preventing fraudulent orders.
      </p>

      <h2>Who else sees it</h2>
      <ul>
        <li>
          <strong>The rider or courier delivering your parcel.</strong> They get
          your name, phone number, town and delivery notes. Nothing else.
        </li>
        <li>
          <strong>Supabase</strong>, which hosts our database, and{" "}
          <strong>Vercel</strong>, which hosts this website. Both store data on
          our behalf.
        </li>
        <li>
          Nobody else. We do not sell, rent or trade your information, and we do
          not pass it to advertisers.
        </li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        Order records, including the delivery details on them, are kept for
        seven years to satisfy tax and accounting rules. There is no marketing
        list to unsubscribe from, because we do not keep one.
      </p>

      <h2>Your rights</h2>
      <p>The Data Protection Act gives you the right to:</p>
      <ul>
        <li>Be told what we hold about you, and be given a copy of it.</li>
        <li>Have anything wrong corrected.</li>
        <li>Have anything we no longer need deleted.</li>
        <li>Object to how we are using it.</li>
        <li>Ask us to move it to another provider.</li>
        <li>Withdraw a consent you gave us earlier.</li>
      </ul>
      <p>
        To use any of these, WhatsApp us with your order number and the phone
        number you ordered with. We will respond within seven days. We may ask
        you to confirm the phone number before we release anything, because
        order number plus phone is how we know an order is yours.
      </p>

      <h2>Complaints</h2>
      <p>
        If you are not satisfied with how we have handled your information, you
        can complain to the Office of the Data Protection Commissioner at{" "}
        <a href="https://www.odpc.go.ke" rel="noreferrer noopener">
          odpc.go.ke
        </a>
        .
      </p>

      <h2>Cookies and your device</h2>
      <p>
        This site sets no advertising or analytics cookies. The one thing stored
        on your device is your shopping bag, kept in your browser local storage
        so it survives a refresh and a closed tab. Clearing your browser data
        empties it.
      </p>

      <h2>Children</h2>
      <p>
        This shop is for adults. We do not knowingly collect information from
        anyone under 18.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes we will change the date at the top of this page.
      </p>
    </PolicyShell>
  );
}