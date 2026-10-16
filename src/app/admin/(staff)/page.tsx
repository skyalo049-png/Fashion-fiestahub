import { redirect } from "next/navigation";

/** /admin is just the orders queue. There is no separate home screen. */
export default function AdminIndex() {
  redirect("/admin/orders");
}