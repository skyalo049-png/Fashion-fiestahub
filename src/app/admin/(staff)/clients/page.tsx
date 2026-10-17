import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/Table";
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
      <header className="border-b border-border-subtle pb-6">
        <p className="font-body text-[10px] uppercase tracking-[0.4em] text-accent">
          Staff
        </p>
        <h1 className="mt-2 font-display text-3xl text-text-primary">Clients</h1>
        <p className="mt-2 max-w-prose font-body text-sm text-text-primary/50">
          {total === 0
            ? "Nobody has placed an order yet."
            : `${total} customer${total === 1 ? "" : "s"}, newest first.`}
        </p>
      </header>

      {clients.length === 0 ? (
        <div className="mt-16 border border-dashed border-border-default px-6 py-16 text-center">
          <p className="font-display text-xl text-text-primary/80">No clients yet</p>
          <p className="mx-auto mt-3 max-w-sm font-body text-sm text-text-primary/40">
            A customer record is created the moment an order is placed. There is
            nothing to show until the first one comes in.
          </p>
        </div>
      ) : (
        <Table className="mt-6">
          <TableHead
            headings={[
              "Name",
              "Phone",
              "Email",
              "Orders",
              "Lifetime",
              "Last order",
            ]}
          />
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-body text-sm text-text-primary">
                  {client.fullName ?? (
                    <span className="text-text-primary/35">No name given</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-[11px]">
                  {client.phone}
                </TableCell>
                <TableCell className="font-body text-xs text-text-primary/50">
                  {client.email ?? (
                    <span className="text-text-primary/25">—</span>
                  )}
                </TableCell>
                <TableCell className="font-body text-xs">
                  {client.orderCount}
                </TableCell>
                <TableCell className="font-body text-xs text-text-primary">
                  {client.lifetimeKes > 0 ? (
                    formatKes(client.lifetimeKes)
                  ) : (
                    <span className="text-text-primary/30">—</span>
                  )}
                </TableCell>
                <TableCell className="font-body text-xs text-text-primary/40">
                  {client.lastOrderAt ? (
                    formatWhen(client.lastOrderAt)
                  ) : (
                    <span className="text-text-primary/25">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}