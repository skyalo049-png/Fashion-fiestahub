import { supabase } from "../lib/supabase";
import { useEffect } from "react";
import { useState } from "react";
import { Link } from "react-router";

type ProductStatus = "Active" | "Draft" | "Out of Stock";
type OrderStatus = "Delivered" | "Shipped" | "Processing" | "Cancelled";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  img: string;
  tag: string | null;
};

type Order = {
  id: string;
  client: string;
  code: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: number;
};

type Client = {
  code: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  joined: string;
};

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: "Nairobi Blazer", category: "Outerwear", price: 12000, stock: 8, status: "Active", img: "https://images.unsplash.com/photo-1563132337-f159f484226c?w=120&h=160&fit=crop&auto=format", tag: null },
  { id: 2, name: "Savanna Wrap Dress", category: "Dresses", price: 7800, stock: 14, status: "Active", img: "https://images.unsplash.com/photo-1709809081557-78f803ce93a0?w=120&h=160&fit=crop&auto=format", tag: "New In" },
  { id: 3, name: "Lagos Street Coat", category: "Outerwear", price: 14500, stock: 5, status: "Active", img: "https://images.unsplash.com/photo-1787779325589-af1886853d11?w=120&h=160&fit=crop&auto=format", tag: null },
  { id: 4, name: "Crimson Midi Dress", category: "Dresses", price: 4500, stock: 0, status: "Out of Stock", img: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=120&h=160&fit=crop&auto=format", tag: "Sale" },
  { id: 5, name: "Dusk Linen Dress", category: "Dresses", price: 6800, stock: 11, status: "Active", img: "https://images.unsplash.com/photo-1730140322846-e6be13da2ce1?w=120&h=160&fit=crop&auto=format", tag: null },
  { id: 6, name: "Vibrant Boho Set", category: "Sets", price: 9500, stock: 3, status: "Active", img: "https://images.unsplash.com/photo-1780245747984-2f0a0ab75876?w=120&h=160&fit=crop&auto=format", tag: "Limited" },
  { id: 7, name: "Sunset Maxi Dress", category: "Dresses", price: 8500, stock: 9, status: "Active", img: "https://images.unsplash.com/photo-1625646741211-711bdd65c570?w=120&h=160&fit=crop&auto=format", tag: "New Arrival" },
  { id: 8, name: "Golden Hour Set", category: "Sets", price: 6200, stock: 7, status: "Draft", img: "https://images.unsplash.com/photo-1639572490660-eab077b737a4?w=120&h=160&fit=crop&auto=format", tag: null },
];

const CATEGORIES = ["Dresses", "Outerwear", "Sets", "Tops", "Accessories"];
const TAGS = ["None", "New In", "New Arrival", "Sale", "Limited", "Bestseller"];
const ORDER_STATUSES: OrderStatus[] = ["Processing", "Shipped", "Delivered", "Cancelled"];
const PRODUCT_STATUSES: ProductStatus[] = ["Active", "Draft", "Out of Stock"];

const STATUS_COLORS: Record<OrderStatus, { bg: string; color: string }> = {
  Delivered: { bg: "rgba(22,163,74,0.15)", color: "#4ade80" },
  Shipped: { bg: "rgba(201,169,110,0.15)", color: "#c9a96e" },
  Processing: { bg: "rgba(59,130,246,0.15)", color: "#93c5fd" },
  Cancelled: { bg: "rgba(239,68,68,0.12)", color: "#f87171" },
};

const PRODUCT_STATUS_COLORS: Record<ProductStatus, { bg: string; color: string }> = {
  Active: { bg: "rgba(22,163,74,0.15)", color: "#4ade80" },
  Draft: { bg: "rgba(107,107,114,0.2)", color: "#9ca3af" },
  "Out of Stock": { bg: "rgba(239,68,68,0.12)", color: "#f87171" },
};

type Tab = "dashboard" | "products" | "orders" | "clients";

type ProductForm = {
  name: string;
  category: string;
  price: string;
  stock: string;
  status: ProductStatus;
  tag: string;
  img: string;
};

const EMPTY_FORM: ProductForm = { name: "", category: "Dresses", price: "", stock: "", status: "Active", tag: "None", img: "" };

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "rgba(244,240,235,0.4)", fontFamily: "var(--font-body)" }}>{label}</label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = { background: "rgba(244,240,235,0.05)", border: "1px solid rgba(244,240,235,0.12)", color: "var(--color-pearl)", padding: "10px 14px", width: "100%", outline: "none", fontFamily: "var(--font-body)", fontSize: "14px" };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

export default function Admin() {
  const [tab, setTab] = useState<Tab>("dashboard");
 const [products, setProducts] = useState<Product[]>([]);

useEffect(() => {
  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*");
    if (error) console.error("Error fetching products:", error);
    else setProducts(data as Product[]);
  };
  fetchProducts();
}, []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase.from("orders").select("*");
      if (error) console.error("Error fetching orders:", error);
      else setOrders(data as Order[]);
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) console.error("Error fetching clients:", error);
      else setClients(data as Client[]);
    };
    fetchClients();
  }, []);

  // Product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Client modal
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", email: "", phone: "" });
  const [newClientCode, setNewClientCode] = useState("");

  const openAddProduct = () => { setEditingProduct(null); setForm(EMPTY_FORM); setShowProductModal(true); };
  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setForm({ name: p.name, category: p.category, price: p.price.toString(), stock: p.stock.toString(), status: p.status, tag: p.tag ?? "None", img: p.img });
    setShowProductModal(true);
  };

  const saveProduct = async () => {
    if (!form.name || !form.price) return;
    const payload = {
      name: form.name,
      category: form.category,
      price: parseInt(form.price) || 0,
      stock: parseInt(form.stock) || 0,
      status: form.status,
      tag: form.tag === "None" ? null : form.tag,
      img: form.img || "https://images.unsplash.com/photo-1625646741211-711bdd65c570?w=120&h=160&fit=crop&auto=format",
    };

    if (editingProduct) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProduct.id)
        .select()
        .single();
      if (error) {
        console.error("Error updating product:", error);
        return;
      }
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? data as Product : p)));
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error("Error adding product:", error);
        return;
      }
      setProducts((prev) => [...prev, data as Product]);
    }
    setShowProductModal(false);
  };

  const deleteProduct = async (id: number) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("Error deleting product:", error);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating order status:", error);
      return;
    }

    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  };

  const saveClient = async () => {
    if (!newClientCode || !clientForm.name) return;

    const payload = {
      code: newClientCode,
      name: clientForm.name,
      email: clientForm.email,
      phone: clientForm.phone,
      totalOrders: 0,
      totalSpent: 0,
      joined: new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
    };

    const { data, error } = await supabase
      .from("clients")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error creating client:", error);
      return;
    }

    setClients((prev) => [...prev, data as Client]);
    setShowClientModal(false);
  };

  const generateCode = () => {
    const num = (clients.length + 10 + Math.floor(Math.random() * 5)).toString().padStart(3, "0");
    return `FFH-${num}`;
  };

  const openAddClient = () => { setClientForm({ name: "", email: "", phone: "" }); setNewClientCode(generateCode()); setShowClientModal(true); };

  // Stats
  const totalRevenue = orders.filter((o) => o.status === "Delivered").reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "Processing" || o.status === "Shipped").length;
  const totalProducts = products.filter((p) => p.status === "Active").length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 4).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-obsidian)", fontFamily: "var(--font-body)" }}>
      {/* Sidebar + main layout */}
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 fixed top-0 left-0 bottom-0 border-r" style={{ background: "var(--color-charcoal)", borderColor: "rgba(201,169,110,0.1)" }}>
          {/* Logo */}
          <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(201,169,110,0.1)" }}>
            <p className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-champagne)" }}>FFH Admin</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(244,240,235,0.3)" }}>Fashion Fiesta Hub</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 px-3">
            {(["dashboard", "products", "orders", "clients"] as Tab[]).map((t) => {
              const icons: Record<Tab, React.ReactNode> = {
                dashboard: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
                products: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
                orders: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
                clients: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
              };
              const labels: Record<Tab, string> = { dashboard: "Dashboard", products: "Products", orders: "Orders", clients: "Clients" };
              return (
                <button key={t} onClick={() => setTab(t)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left mb-1 transition-all duration-150"
                  style={{ background: tab === t ? "rgba(201,169,110,0.12)" : "transparent", color: tab === t ? "var(--color-champagne)" : "rgba(244,240,235,0.5)", border: "none", cursor: "pointer", borderLeft: tab === t ? "2px solid var(--color-champagne)" : "2px solid transparent" }}>
                  {icons[t]}{labels[t]}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-5 py-4 border-t" style={{ borderColor: "rgba(201,169,110,0.1)" }}>
            <Link to="/" className="flex items-center gap-2 text-xs transition-colors duration-200" style={{ color: "rgba(244,240,235,0.35)", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-champagne)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(244,240,235,0.35)")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              View Store
            </Link>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t" style={{ background: "var(--color-charcoal)", borderColor: "rgba(201,169,110,0.1)" }}>
          {(["dashboard", "products", "orders", "clients"] as Tab[]).map((t) => {
            const labels: Record<Tab, string> = { dashboard: "Dash", products: "Products", orders: "Orders", clients: "Clients" };
            return (
              <button key={t} onClick={() => setTab(t)} className="flex-1 py-3 text-xs tracking-wide transition-colors duration-150"
                style={{ background: "none", border: "none", cursor: "pointer", color: tab === t ? "var(--color-champagne)" : "rgba(244,240,235,0.4)", borderTop: tab === t ? "2px solid var(--color-champagne)" : "2px solid transparent" }}>
                {labels[t]}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <main className="flex-1 md:ml-56 pb-20 md:pb-0">
          {/* Top bar */}
          <div className="sticky top-0 z-40 px-6 py-4 border-b flex items-center justify-between" style={{ background: "rgba(14,14,15,0.9)", backdropFilter: "blur(12px)", borderColor: "rgba(201,169,110,0.1)" }}>
            <div>
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "rgba(244,240,235,0.35)" }}>Fashion Fiesta Hub</p>
              <h1 className="text-lg font-semibold capitalize" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>{tab}</h1>
            </div>
            <div className="flex items-center gap-3">
              {tab === "products" && (
                <button onClick={openAddProduct} className="flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase font-medium transition-opacity hover:opacity-90" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", border: "none", cursor: "pointer", letterSpacing: "0.1em" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Add Product
                </button>
              )}
              {tab === "clients" && (
                <button onClick={openAddClient} className="flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase font-medium transition-opacity hover:opacity-90" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", border: "none", cursor: "pointer", letterSpacing: "0.1em" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Add Client
                </button>
              )}
            </div>
          </div>

          <div className="p-6">

            {/* ── DASHBOARD ── */}
            {tab === "dashboard" && (
              <div>
                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Total Revenue", value: `KSh ${totalRevenue.toLocaleString()}`, sub: "From delivered orders", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, accent: true },
                    { label: "Pending Orders", value: pendingOrders.toString(), sub: "Processing + Shipped", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, accent: false },
                    { label: "Active Products", value: totalProducts.toString(), sub: `${lowStock} low on stock`, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>, accent: false },
                    { label: "Total Clients", value: clients.length.toString(), sub: `KSh ${(totalRevenue / clients.length).toLocaleString()} avg spend`, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>, accent: false },
                  ].map(({ label, value, sub, icon, accent }) => (
                    <div key={label} className="p-5" style={{ background: accent ? "rgba(201,169,110,0.08)" : "rgba(244,240,235,0.03)", border: `1px solid ${accent ? "rgba(201,169,110,0.25)" : "rgba(244,240,235,0.07)"}` }}>
                      <div className="flex items-start justify-between mb-3">
                        <span style={{ color: accent ? "var(--color-champagne)" : "rgba(244,240,235,0.4)" }}>{icon}</span>
                      </div>
                      <p className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: accent ? "var(--color-champagne)" : "var(--color-pearl)" }}>{value}</p>
                      <p className="text-xs tracking-[0.15em] uppercase mb-0.5" style={{ color: "rgba(244,240,235,0.5)" }}>{label}</p>
                      <p className="text-xs" style={{ color: "rgba(244,240,235,0.3)" }}>{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Recent orders */}
                <div style={{ border: "1px solid rgba(244,240,235,0.07)" }}>
                  <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(244,240,235,0.07)" }}>
                    <h2 className="text-sm font-medium" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-display)" }}>Recent Orders</h2>
                    <button onClick={() => setTab("orders")} className="text-xs" style={{ background: "none", border: "none", color: "var(--color-champagne)", cursor: "pointer" }}>View all →</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(244,240,235,0.02)" }}>
                          {["Order", "Client", "Date", "Status", "Total"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs tracking-widest uppercase" style={{ color: "rgba(244,240,235,0.3)", fontWeight: 400, borderBottom: "1px solid rgba(244,240,235,0.06)" }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 4).map((order) => {
                          const { bg, color } = STATUS_COLORS[order.status];
                          return (
                            <tr key={order.id} style={{ borderBottom: "1px solid rgba(244,240,235,0.04)" }}>
                              <td className="px-5 py-3.5 font-mono text-sm" style={{ color: "var(--color-champagne)" }}>{order.id}</td>
                              <td className="px-5 py-3.5 text-sm" style={{ color: "var(--color-pearl)" }}>{order.client}</td>
                              <td className="px-5 py-3.5 text-sm" style={{ color: "rgba(244,240,235,0.5)" }}>{order.date}</td>
                              <td className="px-5 py-3.5"><span className="text-xs px-2.5 py-1 tracking-wide uppercase" style={{ background: bg, color }}>{order.status}</span></td>
                              <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "var(--color-pearl)" }}>KSh {order.total.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Low stock alert */}
                {lowStock > 0 && (
                  <div className="mt-4 px-5 py-4 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <p className="text-sm" style={{ color: "rgba(244,240,235,0.7)" }}><span style={{ color: "#f87171" }}>{lowStock} product{lowStock > 1 ? "s" : ""}</span> running low on stock. <button onClick={() => setTab("products")} style={{ background: "none", border: "none", color: "var(--color-champagne)", cursor: "pointer", fontSize: "14px", padding: 0 }}>Manage products →</button></p>
                  </div>
                )}
              </div>
            )}

            {/* ── PRODUCTS ── */}
            {tab === "products" && (
              <div>
                <div className="overflow-x-auto" style={{ border: "1px solid rgba(244,240,235,0.07)" }}>
                  <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 700 }}>
                    <thead>
                      <tr style={{ background: "rgba(244,240,235,0.02)" }}>
                        {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs tracking-widest uppercase" style={{ color: "rgba(244,240,235,0.3)", fontWeight: 400, borderBottom: "1px solid rgba(244,240,235,0.06)" }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => {
                        const { bg, color } = PRODUCT_STATUS_COLORS[p.status];
                        return (
                          <tr key={p.id} style={{ borderBottom: "1px solid rgba(244,240,235,0.04)" }}>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <img src={p.img} alt={p.name} className="w-10 h-12 object-cover flex-shrink-0" style={{ background: "var(--color-charcoal)" }} />
                                <div>
                                  <p className="text-sm font-medium" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-display)" }}>{p.name}</p>
                                  {p.tag && <span className="text-xs" style={{ color: "var(--color-champagne)" }}>{p.tag}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-xs tracking-wide uppercase" style={{ color: "rgba(244,240,235,0.5)" }}>{p.category}</td>
                            <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "var(--color-pearl)" }}>KSh {p.price.toLocaleString()}</td>
                            <td className="px-5 py-3.5 text-sm" style={{ color: p.stock === 0 ? "#f87171" : p.stock <= 4 ? "#fb923c" : "rgba(244,240,235,0.6)" }}>{p.stock === 0 ? "Out" : `${p.stock} left`}</td>
                            <td className="px-5 py-3.5"><span className="text-xs px-2.5 py-1 tracking-wide uppercase" style={{ background: bg, color }}>{p.status}</span></td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <button onClick={() => openEditProduct(p)} className="text-xs transition-colors duration-150" style={{ background: "none", border: "none", color: "rgba(244,240,235,0.5)", cursor: "pointer" }}
                                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-champagne)")}
                                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(244,240,235,0.5)")}>Edit</button>
                                {deleteConfirm === p.id ? (
                                  <span className="flex items-center gap-2">
                                    <button onClick={() => deleteProduct(p.id)} className="text-xs" style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>Confirm</button>
                                    <button onClick={() => setDeleteConfirm(null)} className="text-xs" style={{ background: "none", border: "none", color: "rgba(244,240,235,0.3)", cursor: "pointer" }}>Cancel</button>
                                  </span>
                                ) : (
                                  <button onClick={() => setDeleteConfirm(p.id)} className="text-xs transition-colors duration-150" style={{ background: "none", border: "none", color: "rgba(244,240,235,0.3)", cursor: "pointer" }}
                                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f87171")}
                                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(244,240,235,0.3)")}>Delete</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <div style={{ border: "1px solid rgba(244,240,235,0.07)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 700 }}>
                    <thead>
                      <tr style={{ background: "rgba(244,240,235,0.02)" }}>
                        {["Order ID", "Client", "Code", "Date", "Items", "Total", "Status", "Update"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs tracking-widest uppercase" style={{ color: "rgba(244,240,235,0.3)", fontWeight: 400, borderBottom: "1px solid rgba(244,240,235,0.06)" }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const { bg, color } = STATUS_COLORS[order.status];
                        return (
                          <tr key={order.id} style={{ borderBottom: "1px solid rgba(244,240,235,0.04)" }}>
                            <td className="px-5 py-4 font-mono text-sm font-semibold" style={{ color: "var(--color-champagne)" }}>{order.id}</td>
                            <td className="px-5 py-4 text-sm" style={{ color: "var(--color-pearl)" }}>{order.client}</td>
                            <td className="px-5 py-4 font-mono text-xs" style={{ color: "rgba(244,240,235,0.45)" }}>{order.code}</td>
                            <td className="px-5 py-4 text-sm" style={{ color: "rgba(244,240,235,0.5)" }}>{order.date}</td>
                            <td className="px-5 py-4 text-sm" style={{ color: "rgba(244,240,235,0.5)" }}>{order.items} item{order.items > 1 ? "s" : ""}</td>
                            <td className="px-5 py-4 text-sm font-semibold" style={{ color: "var(--color-pearl)" }}>KSh {order.total.toLocaleString()}</td>
                            <td className="px-5 py-4"><span className="text-xs px-2.5 py-1 tracking-wide uppercase" style={{ background: bg, color }}>{order.status}</span></td>
                            <td className="px-5 py-4">
                              <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                style={{ background: "rgba(244,240,235,0.05)", border: "1px solid rgba(244,240,235,0.1)", color: "rgba(244,240,235,0.6)", padding: "4px 8px", fontSize: "12px", cursor: "pointer", outline: "none" }}>
                                {ORDER_STATUSES.map((s) => <option key={s} value={s} style={{ background: "#1a1a1d" }}>{s}</option>)}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── CLIENTS ── */}
            {tab === "clients" && (
              <div style={{ border: "1px solid rgba(244,240,235,0.07)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 700 }}>
                    <thead>
                      <tr style={{ background: "rgba(244,240,235,0.02)" }}>
                        {["Code", "Name", "Email", "Phone", "Orders", "Total Spent", "Joined"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs tracking-widest uppercase" style={{ color: "rgba(244,240,235,0.3)", fontWeight: 400, borderBottom: "1px solid rgba(244,240,235,0.06)" }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c) => (
                        <tr key={c.code} style={{ borderBottom: "1px solid rgba(244,240,235,0.04)" }}>
                          <td className="px-5 py-4 font-mono text-sm font-semibold" style={{ color: "var(--color-champagne)" }}>{c.code}</td>
                          <td className="px-5 py-4 text-sm font-medium" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-display)" }}>{c.name}</td>
                          <td className="px-5 py-4 text-sm" style={{ color: "rgba(244,240,235,0.5)" }}>{c.email}</td>
                          <td className="px-5 py-4 text-sm" style={{ color: "rgba(244,240,235,0.5)" }}>{c.phone}</td>
                          <td className="px-5 py-4 text-sm" style={{ color: "rgba(244,240,235,0.6)" }}>{c.totalOrders}</td>
                          <td className="px-5 py-4 text-sm font-semibold" style={{ color: "var(--color-champagne)" }}>KSh {c.totalSpent.toLocaleString()}</td>
                          <td className="px-5 py-4 text-sm" style={{ color: "rgba(244,240,235,0.4)" }}>{c.joined}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── Product Modal ── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: "var(--color-charcoal)", border: "1px solid rgba(201,169,110,0.2)" }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(244,240,235,0.08)" }}>
              <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={() => setShowProductModal(false)} style={{ background: "none", border: "none", color: "rgba(244,240,235,0.4)", cursor: "pointer", fontSize: "20px" }}>×</button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <Field label="Product Name">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nairobi Blazer" style={inputStyle} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={selectStyle}>
                    {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: "#1a1a1d" }}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Tag">
                  <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} style={selectStyle}>
                    {TAGS.map((t) => <option key={t} value={t} style={{ background: "#1a1a1d" }}>{t}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price (KSh)">
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 8500" style={inputStyle} />
                </Field>
                <Field label="Stock Qty">
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="e.g. 10" style={inputStyle} />
                </Field>
              </div>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })} style={selectStyle}>
                  {PRODUCT_STATUSES.map((s) => <option key={s} value={s} style={{ background: "#1a1a1d" }}>{s}</option>)}
                </select>
              </Field>
              <Field label="Image URL (optional)">
                <input value={form.img} onChange={(e) => setForm({ ...form, img: e.target.value })} placeholder="https://images.unsplash.com/..." style={inputStyle} />
              </Field>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setShowProductModal(false)} className="px-5 py-2.5 text-xs tracking-widest uppercase" style={{ background: "transparent", border: "1px solid rgba(244,240,235,0.15)", color: "rgba(244,240,235,0.5)", cursor: "pointer" }}>Cancel</button>
              <button onClick={saveProduct} className="px-6 py-2.5 text-xs tracking-widest uppercase font-medium" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", border: "none", cursor: "pointer" }}>{editingProduct ? "Save Changes" : "Add Product"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Client Modal ── */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md" style={{ background: "var(--color-charcoal)", border: "1px solid rgba(201,169,110,0.2)" }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(244,240,235,0.08)" }}>
              <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>Add New Client</h2>
              <button onClick={() => setShowClientModal(false)} style={{ background: "none", border: "none", color: "rgba(244,240,235,0.4)", cursor: "pointer", fontSize: "20px" }}>×</button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Auto-generated code */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: "rgba(201,169,110,0.07)", border: "1px solid rgba(201,169,110,0.2)" }}>
                <div>
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(244,240,235,0.4)" }}>Assigned Client Code</p>
                  <p className="text-xl font-mono font-bold" style={{ color: "var(--color-champagne)" }}>{newClientCode}</p>
                </div>
                <button onClick={() => setNewClientCode(generateCode())} style={{ background: "none", border: "none", color: "rgba(244,240,235,0.4)", cursor: "pointer", fontSize: "12px", letterSpacing: "0.1em" }}>Regenerate</button>
              </div>
              <Field label="Full Name">
                <input value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} placeholder="e.g. Amina Wanjiru" style={inputStyle} />
              </Field>
              <Field label="Email">
                <input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} placeholder="e.g. amina@email.com" style={inputStyle} />
              </Field>
              <Field label="Phone">
                <input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} placeholder="e.g. +254 700 000 000" style={inputStyle} />
              </Field>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setShowClientModal(false)} className="px-5 py-2.5 text-xs tracking-widest uppercase" style={{ background: "transparent", border: "1px solid rgba(244,240,235,0.15)", color: "rgba(244,240,235,0.5)", cursor: "pointer" }}>Cancel</button>
              <button onClick={saveClient} className="px-6 py-2.5 text-xs tracking-widest uppercase font-medium" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", border: "none", cursor: "pointer" }}>Create Client</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
