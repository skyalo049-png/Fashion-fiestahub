import Link from "next/link";

import PolicyShell from "@/components/PolicyShell";
import { site } from "@/lib/site";

export const metadata = {
  title: "Size guide",
  description:
    "How to measure yourself, what our sizes mean, and where to find the exact chart for the piece you are looking at.",
  alternates: { canonical: "/size-guide" },
};

/**
 * Every product page carries its own chart, because a chart is a property of
 * the garment and not of the shop — a bias-cut satin dress and a cotton wrap
 * top do not share a hip measurement. This page is the part that *is* shared:
 * how to hold the tape, and what "fitted" and "relaxed" mean here.
 *
 * The per-garment tables below are the shop's own blocks, for the categories we
 * cut most often. If a product page shows a chart, that chart wins.
 */
export default function SizeGuidePage() {
  return (
    <PolicyShell
      title="Size guide"
      intro="A tape measure, a mirror, and five minutes. Measuring yourself once beats exchanging a parcel twice — and if you are between sizes, message us and we will tell you which way that particular garment runs."
    >
      <h2>How to measure</h2>
      <p>
        Measure over your underwear or a thin slip, not over a dress. Keep the
        tape snug against the body but not pulled tight — if it leaves a mark,
        it is too tight, and you will order a size that gapes everywhere else.
        Stand relaxed and breathe normally.
      </p>
      <ul>
        <li>
          <strong>Bust</strong> — around the fullest part of your chest, tape
          level under the arms and across the back.
        </li>
        <li>
          <strong>Waist</strong> — around the narrowest part of your middle,
          usually just above the navel. Bend sideways; the crease is your waist.
        </li>
        <li>
          <strong>Hips</strong> — around the fullest part of your hips and
          bottom, roughly 20&nbsp;cm below the waist. Keep the tape level all the
          way round, not dipping at the back.
        </li>
        <li>
          <strong>Length</strong> — from the top of the shoulder straight down to
          the hem, for a dress or top.
        </li>
      </ul>
      <p>
        Write the numbers down. If you measure on a different day and get a
        different answer, order the larger size — a garment can be taken in, but
        it cannot be let out.
      </p>

      <h2>What our sizes mean</h2>
      <p>
        Our sizes are cut to the body measurements in this table, with a little
        ease built in so the garment sits on you rather than gripping. All
        measurements are in centimetres.
      </p>

      <h3>Dresses, two-piece sets and jumpsuits</h3>
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Bust</th>
            <th>Waist</th>
            <th>Hips</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>S</td>
            <td>82–86</td>
            <td>64–68</td>
            <td>88–92</td>
          </tr>
          <tr>
            <td>M</td>
            <td>87–91</td>
            <td>69–73</td>
            <td>93–97</td>
          </tr>
          <tr>
            <td>L</td>
            <td>92–97</td>
            <td>74–79</td>
            <td>98–103</td>
          </tr>
          <tr>
            <td>XL</td>
            <td>98–104</td>
            <td>80–86</td>
            <td>104–110</td>
          </tr>
        </tbody>
      </table>

      <h3>Tops, blouses and shirts</h3>
      <p>
        Cut closer through the body than a dress. If your bust and waist land in
        different rows, go by the bust — the waist of a top is usually easy to
        let out or belt, and the shoulders are not.
      </p>
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Bust</th>
            <th>Waist</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>S</td>
            <td>82–86</td>
            <td>64–68</td>
          </tr>
          <tr>
            <td>M</td>
            <td>87–91</td>
            <td>69–73</td>
          </tr>
          <tr>
            <td>L</td>
            <td>92–97</td>
            <td>74–79</td>
          </tr>
          <tr>
            <td>XL</td>
            <td>98–104</td>
            <td>80–86</td>
          </tr>
        </tbody>
      </table>

      <h3>Skirts and trousers</h3>
      <p>
        Sized on the waist and hips, not the bust. Measure your waist at its
        narrowest and your hips at their fullest, then read across.
      </p>
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Waist</th>
            <th>Hips</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>S</td>
            <td>64–68</td>
            <td>88–92</td>
          </tr>
          <tr>
            <td>M</td>
            <td>69–73</td>
            <td>93–97</td>
          </tr>
          <tr>
            <td>L</td>
            <td>74–79</td>
            <td>98–103</td>
          </tr>
          <tr>
            <td>XL</td>
            <td>80–86</td>
            <td>104–110</td>
          </tr>
        </tbody>
      </table>

      <h3>One size</h3>
      <p>
        Wraps, kimonos, shawls and tie-waist pieces are cut to sit on a range of
        bodies rather than one size. The product page says how much adjustability
        there is — a wrap with a long sash fits far more differently than a
        kaftan with a fixed neckline. One size generally covers our S through L.
        If you are above that range, message us before ordering and we will tell
        you honestly whether it will work.
      </p>

      <h2>Fitted, relaxed and oversized</h2>
      <p>
        Two garments with the same measurements can sit completely differently,
        because the cut is doing the work. Each product page carries a{" "}
        <strong>Fit</strong> note saying which of these it is, and whether the
        model sized up.
      </p>
      <ul>
        <li>
          <strong>Fitted</strong> — follows the body. Order your measured size.
        </li>
        <li>
          <strong>Relaxed</strong> — a hand&rsquo;s width of ease through the
          body. Order your measured size for a clean line, or one up for more
          room.
        </li>
        <li>
          <strong>Oversized</strong> — deliberately loose. Most customers take
          their usual size, and some take one down.
        </li>
      </ul>

      <h2>Between two sizes?</h2>
      <p>
        Message us on WhatsApp with your measurements and the piece you are
        looking at. We have the garment in front of us and can measure the actual
        one you would receive — which beats any table, including this one. If you
        order and it is wrong, our{" "}
        <Link href="/returns">returns policy</Link> gives you seven days.
      </p>

      <h2>Made to measure</h2>
      <p>
        Some pieces can be cut to your measurements for an additional fee and a
        longer lead time. Ask us before ordering, because a made-to-measure piece
        cannot be returned or exchanged — it was cut for you and cannot be sold
        to anyone else. The full detail is in{" "}
        <Link href="/returns">Returns and exchanges</Link>.
      </p>

      <h2>Care for the size you bought</h2>
      <p>
        Wash cold, dry in the shade, and never wring a print. Anything more
        specific is on the product page under <strong>Care</strong>. Heat is what
        shrinks a garment — and a shrunk dress is the one sizing problem a size
        guide cannot fix.
      </p>

      <p className="text-pearl/40">
        Measuring in Nairobi and would rather we did it? Message us and we will
        arrange a time at our {site.city} pickup point.
      </p>
    </PolicyShell>
  );
}