import { listClients } from "@/lib/admin-clients";
import { formatKes, formatWhen } from "@/lib/format";

export const metadata = { title: "Clients" };

/**
 * People who have actually bought something, or at least placed an order.
 *
 * There is deliberately no search box built from a lookup table here. Every row
 * on this screen is a real `customers` record, created when an order was placed
 * — not a phone number somebody once typed into the tracking form and got
 * wrong. A list padded with mistyped numbers is a list staff stop trusting, and
 * a list staff stop trusting gets exported to a spreadsheet and used anyway.
 *
 * Lifetime value counts confirmed money only. A cancelled order was never
 * revenue, and an order still waiting on a delivery quote contributes its
 * subtotal — the goods are real even while the fee is not yet known.
 */

export default async function ClientsPage() {
  const { clients, total } = await listClients();

  return (
    <div>
      <header className="border-b border-pearl/10 pb-6">
        <p className="font-body text-[10px] uppercase tracking-[0.4em] text-champagne">
          Staff
        </p>
        <h1 className="mt-2 font-display text-3xl text-pearl">Clients</h1>
        <p className="mt-2 max-w-prose font-body text-sm text-pearl/50">
          {total === 0
            ? "Nobody has placed an order yet."
            : `${total} customer${total === 1 ? "" : "s"}, newest first.`}
        </p>
      </header>

      {clients.length === 0 ? (
        <div className="mt-16 border border-dashed border-pearl/15 px-6 py-16 text-center">
          <p className="font-display text-xl text-pearl/80">No clients yet</p>
          <p className="mx-auto mt-3 max-w-sm font-body text-sm text-pearl/40">
            A customer record is created the moment an order is placed. There is
            nothing to show until the first one comes in.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-pearl/10">
                {[
                  "Name",
                  "Phone",
                  "Email",
                  "Orders",
                  "Lifetime",
                  "Last order",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="pb-3 pr-4 font-body text-[10px] uppercase tracking-[0.2em] text-pearl/40"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-pearl/10">
              {clients.map((client) => (
                <tr key={client.id} className="text-pearl/70">
                  <td className="py-3 pr-4 font-body text-sm text-pearl">
                    {client.fullName ?? (
                      <span className="text-pearl/35">No name given</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-mono text-[11px]">
                    {client.phone}
                  </td>
                  <td className="py-3 pr-4 font-body text-xs text-pearl/50">
                    {client.email ?? (
                      <span className="text-pearl/25">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-body text-xs">
                    {client.orderCount}
                  </td>
                  <td className="py-3 pr-4 font-body text-xs text-pearl">
                    {client.lifetimeKes > 0 ? (
                      formatKes(client.lifetimeKes)
                    ) : (
                      <span className="text-pearl/30">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-body text-xs text-pearl/40">
                    {client.lastOrderAt ? (
                      formatWhen(client.lastOrderAt)
                    ) : (
                      <span className="text-pearl/25">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}