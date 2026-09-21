import { useState } from "react";
import { Link } from "react-router";
import { supabase } from "../lib/supabase";

type OrderItem = { name: string; category: string; qty: number; price: number };
type Order = {
  id: string;
  date: string;
  status: "Delivered" | "Shipped" | "Processing" | "Cancelled";
  items: OrderItem[];
};
type ClientRecord = { name: string; orders: Order[] };

type StoreProduct = {
  id: number;
  name: string;
  category: string;
  price: string;
  originalPrice?: string | null;
  img: string;
  tag: string | null;
};

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
  img: string;
};

type CheckoutForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const CLIENT_DATA: Record<string, ClientRecord> = {
  "FFH-001": {
    name: "Amina Wanjiru",
    orders: [
      {
        id: "ORD-8821",
        date: "12 Sep 2026",
        status: "Delivered",
        items: [
          { name: "Nairobi Blazer", category: "Outerwear", qty: 1, price: 12000 },
          { name: "Savanna Wrap Dress", category: "Dresses", qty: 2, price: 7800 },
        ],
      },
      {
        id: "ORD-8956",
        date: "1 Sep 2026",
        status: "Delivered",
        items: [
          { name: "Sunset Maxi Dress", category: "Dresses", qty: 1, price: 8500 },
        ],
      },
    ],
  },
  "FFH-002": {
    name: "Zawadi Otieno",
    orders: [
      {
        id: "ORD-9102",
        date: "14 Sep 2026",
        status: "Shipped",
        items: [
          { name: "Vibrant Boho Set", category: "Sets", qty: 1, price: 9500 },
          { name: "Dusk Linen Dress", category: "Dresses", qty: 1, price: 6800 },
          { name: "Crimson Midi Dress", category: "Dresses", qty: 1, price: 4500 },
        ],
      },
    ],
  },
  "FFH-003": {
    name: "Fatuma Njeri",
    orders: [
      {
        id: "ORD-9045",
        date: "10 Sep 2026",
        status: "Processing",
        items: [
          { name: "Lagos Street Coat", category: "Outerwear", qty: 1, price: 14500 },
        ],
      },
      {
        id: "ORD-8874",
        date: "28 Aug 2026",
        status: "Delivered",
        items: [
          { name: "Golden Hour Set", category: "Sets", qty: 2, price: 6200 },
          { name: "Nairobi Blazer", category: "Outerwear", qty: 1, price: 12000 },
        ],
      },
    ],
  },
};

const STATUS_STYLE: Record<Order["status"], { bg: string; color: string }> = {
  Delivered: { bg: "rgba(22,163,74,0.15)", color: "#4ade80" },
  Shipped: { bg: "rgba(201,169,110,0.15)", color: "#c9a96e" },
  Processing: { bg: "rgba(59,130,246,0.15)", color: "#93c5fd" },
  Cancelled: { bg: "rgba(239,68,68,0.12)", color: "#f87171" },
};

const NAV_LINKS = ["New In", "Dresses", "Tops", "Outerwear", "Sale"];

const HERO_PRODUCTS = [
  {
    id: 1,
    name: "Sunset Maxi Dress",
    price: "KSh 8,500",
    img: "https://images.unsplash.com/photo-1625646741211-711bdd65c570?w=800&h=1100&fit=crop&auto=format",
    tag: "New Arrival",
  },
  {
    id: 2,
    name: "Golden Hour Set",
    price: "KSh 6,200",
    img: "https://images.unsplash.com/photo-1639572490660-eab077b737a4?w=800&h=1100&fit=crop&auto=format",
    tag: "Bestseller",
  },
];

const FEATURED_PRODUCTS: StoreProduct[] = [
  { id: 1, name: "Nairobi Blazer", category: "Outerwear", price: "KSh 12,000", originalPrice: null, img: "https://images.unsplash.com/photo-1563132337-f159f484226c?w=600&h=800&fit=crop&auto=format", tag: null },
  { id: 2, name: "Savanna Wrap Dress", category: "Dresses", price: "KSh 7,800", originalPrice: null, img: "https://images.unsplash.com/photo-1709809081557-78f803ce93a0?w=600&h=800&fit=crop&auto=format", tag: "New In" },
  { id: 3, name: "Lagos Street Coat", category: "Outerwear", price: "KSh 14,500", originalPrice: null, img: "https://images.unsplash.com/photo-1787779325589-af1886853d11?w=600&h=800&fit=crop&auto=format", tag: null },
  { id: 4, name: "Crimson Midi Dress", category: "Dresses", price: "KSh 4,500", originalPrice: "KSh 9,000", img: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=600&h=800&fit=crop&auto=format", tag: "Sale" },
  { id: 5, name: "Dusk Linen Dress", category: "Dresses", price: "KSh 6,800", originalPrice: null, img: "https://images.unsplash.com/photo-1730140322846-e6be13da2ce1?w=600&h=800&fit=crop&auto=format", tag: null },
  { id: 6, name: "Vibrant Boho Set", category: "Sets", price: "KSh 9,500", originalPrice: null, img: "https://images.unsplash.com/photo-1780245747984-2f0a0ab75876?w=600&h=800&fit=crop&auto=format", tag: "Limited" },
];

const CATEGORIES = [
  { label: "Dresses", count: "48 pieces", img: "https://images.unsplash.com/photo-1625646741211-711bdd65c570?w=400&h=560&fit=crop&auto=format" },
  { label: "Outerwear", count: "23 pieces", img: "https://images.unsplash.com/photo-1787779325589-af1886853d11?w=400&h=560&fit=crop&auto=format" },
  { label: "Tops", count: "61 pieces", img: "https://images.unsplash.com/photo-1563132337-f159f484226c?w=400&h=560&fit=crop&auto=format" },
];

const FILTERS = ["All", "Dresses", "Outerwear", "Sets", "New In", "Sale"];
const EMPTY_CHECKOUT_FORM: CheckoutForm = { name: "", phone: "", email: "", address: "", notes: "" };
const HELP_CONTENT: Record<string, { title: string; items: { question?: string; answer: string }[] }> = {
  FAQ: {
    title: "Frequently Asked Questions",
    items: [
      { question: "How do I place an order?", answer: "Browse products, add to bag, and check out as a guest — no account needed." },
      { question: "What payment methods do you accept?", answer: "We accept M-Pesa via Pochi la Biashara — pay to 0798 638 605 at checkout." },
      { question: "How do I track my order?", answer: "Use your order code (sent after checkout) on our order lookup page." },
      { question: "Can I change or cancel my order?", answer: "Contact us on WhatsApp as soon as possible after ordering." },
      { question: "Do you deliver outside Nairobi?", answer: "Yes, nationwide delivery available." },
    ],
  },
  "Shipping & Returns": {
    title: "Shipping & Returns",
    items: [
      { answer: "Nairobi delivery: 1-2 business days, free on orders over KSh 3,000, otherwise a flat delivery fee applies." },
      { answer: "Nationwide delivery (outside Nairobi): 2-5 business days via courier, fee calculated at checkout." },
      { answer: "Returns accepted within 7 days of delivery for unworn items with tags attached." },
      { answer: "Contact us via WhatsApp to initiate a return or exchange." },
    ],
  },
  "Sizing Guide": {
    title: "Sizing Guide",
    items: [
      { answer: "Standard sizing: XS, S, M, L, XL." },
      { answer: "When between sizes, we recommend sizing up for a relaxed fit." },
      { answer: "Questions about fit? Message us on WhatsApp before ordering." },
    ],
  },
};

export default function Store() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>(EMPTY_CHECKOUT_FORM);
  const [checkoutError, setCheckoutError] = useState("");
  const [orderConfirmation, setOrderConfirmation] = useState<{ id: string; code: string; total: number; items: number; name: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [orderInput, setOrderInput] = useState("");
  const [orderError, setOrderError] = useState(false);
  const [helpOpen, setHelpOpen] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactOpen, setContactOpen] = useState(false);

  const clientRecord = orderCode ? CLIENT_DATA[orderCode.toUpperCase()] : null;

  const handleOrderLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const key = orderInput.trim().toUpperCase();
    if (CLIENT_DATA[key]) { setOrderCode(key); setOrderError(false); }
    else { setOrderError(true); setOrderCode(""); }
  };

  const filterMatches = activeFilter === "All" ? FEATURED_PRODUCTS : FEATURED_PRODUCTS.filter((p) => p.category === activeFilter || p.tag === activeFilter);
  const filtered = searchQuery.trim()
    ? filterMatches.filter((product) => product.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : filterMatches;
  const scrollToProducts = () => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const parsePrice = (price: string) => Number(price.replace(/[^0-9]/g, ""));

  const addToCart = (product: StoreProduct) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id && item.size === null && item.color === null);
      if (existing) {
        return prev.map((item) => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: parsePrice(product.price), quantity: 1, size: null, color: null, img: product.img }];
    });
  };

  const updateCartQuantity = (id: number, quantity: number) => {
    setCartItems((prev) => quantity <= 0 ? prev.filter((item) => item.id !== id) : prev.map((item) => item.id === id ? { ...item, quantity } : item));
  };

  const removeFromCart = (id: number) => setCartItems((prev) => prev.filter((item) => item.id !== id));

  const generateOrderCode = () => `FFH-${(Date.now() % 1000).toString().padStart(3, "0")}`;

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setCheckoutError("");

    const orderId = `ORD-${Date.now().toString().slice(-8)}`;
    const code = generateOrderCode();
    const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
    const payload = {
      id: orderId,
      client: checkoutForm.name,
      phone: checkoutForm.phone,
      email: checkoutForm.email,
      address: checkoutForm.address,
      code,
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      status: "Processing",
      total: cartTotal,
      items: itemCount,
    };

    const { error } = await supabase.from("orders").insert(payload);
    if (error) {
      console.error("Error placing order:", error);
      setCheckoutError("We could not place your order. Please try again.");
      return;
    }

    setCartItems([]);
    setCheckoutOpen(false);
    setCartOpen(false);
    setOrderConfirmation({ id: orderId, code, total: cartTotal, items: itemCount, name: checkoutForm.name });
    setCheckoutForm(EMPTY_CHECKOUT_FORM);
  };
  const toggleWishlist = (id: number) => setWishlist((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      {/* Announcement bar */}
      <div className="text-center py-2.5 text-xs tracking-widest uppercase" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", letterSpacing: "0.15em" }}>
        Free delivery within Nairobi on orders over KSh 3,000 &nbsp;·&nbsp; New arrivals every Friday
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(14,14,15,0.92)", backdropFilter: "blur(16px)", borderColor: "rgba(201,169,110,0.15)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div style={{ fontFamily: "var(--font-display)" }}>
            <span className="text-xl font-bold tracking-wide" style={{ color: "var(--color-champagne)" }}>Fashion Fiesta</span>
            <span className="text-xl font-bold tracking-wide" style={{ color: "var(--color-pearl)" }}> Hub</span>
            <span className="text-xs tracking-[0.25em] uppercase ml-2 opacity-50 hidden sm:inline" style={{ fontFamily: "var(--font-body)", color: "var(--color-pearl)" }}>· Nairobi, Kenya</span>
          </div>
          <ul className="hidden md:flex gap-8 list-none m-0 p-0">
            {NAV_LINKS.map((link) => (
              <li key={link}>
                <a href="#" className="text-sm tracking-wide transition-colors duration-200" style={{ color: link === "Sale" ? "var(--color-champagne)" : "rgba(244,240,235,0.75)", textDecoration: "none" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--color-pearl)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = link === "Sale" ? "var(--color-champagne)" : "rgba(244,240,235,0.75)")}>
                  {link}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4">
            {searchOpen && (
              <input
                autoFocus
                type="search"
                aria-label="Search products"
                placeholder="Search pieces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 sm:w-48 px-2 py-1 text-sm outline-none"
                style={{ background: "rgba(244,240,235,0.06)", border: "1px solid rgba(201,169,110,0.3)", color: "var(--color-pearl)" }}
              />
            )}
            <button aria-label="Search" onClick={() => {
              setSearchOpen((open) => {
                if (open) setSearchQuery("");
                return !open;
              });
            }} style={{ color: "var(--color-pearl)", background: "none", border: "none", cursor: "pointer", opacity: 0.7 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </button>
            <button aria-label="Wishlist" style={{ color: "var(--color-pearl)", background: "none", border: "none", cursor: "pointer", opacity: 0.7 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            </button>
            <button aria-label={`Cart (${cartCount})`} className="relative" onClick={() => setCartOpen(true)} style={{ color: "var(--color-pearl)", background: "none", border: "none", cursor: "pointer", opacity: 0.7 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
              {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", fontSize: "10px", fontWeight: 600 }}>{cartCount}</span>}
            </button>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: "var(--color-pearl)", background: "none", border: "none", cursor: "pointer" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{mobileMenuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}</svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden px-6 pb-4 border-t" style={{ borderColor: "rgba(201,169,110,0.15)" }}>
            <ul className="list-none m-0 p-0 pt-4 flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <li key={link}><a href="#" style={{ color: link === "Sale" ? "var(--color-champagne)" : "rgba(244,240,235,0.75)", textDecoration: "none", fontSize: "14px" }}>{link}</a></li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: "85vh" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0e0e0f 0%, #1a1a1d 40%, #242428 100%)" }} />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20" style={{ background: "radial-gradient(ellipse at 80% 30%, rgba(201,169,110,0.3) 0%, transparent 60%)" }} />
        <div className="relative max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center" style={{ minHeight: "85vh" }}>
          <div>
            <p className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color: "var(--color-champagne)" }}>Nairobi, Kenya · Autumn / Winter 2026</p>
            <h1 className="font-semibold leading-tight mb-6" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.8rem, 6vw, 5rem)", color: "var(--color-pearl)", lineHeight: 1.1 }}>
              Celebrate the <em style={{ color: "var(--color-champagne)" }}>African</em> woman in you
            </h1>
            <p className="text-base mb-10 max-w-md leading-relaxed" style={{ color: "rgba(244,240,235,0.6)", fontWeight: 300 }}>
              Fashion Fiesta Hub is your go-to ladies fashion destination in Kenya. Bold styles, vibrant energy, and pieces that speak to the confident African woman.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-3.5 text-sm tracking-widest uppercase font-medium transition-all duration-200 hover:scale-105" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", border: "none", cursor: "pointer", letterSpacing: "0.12em" }} onClick={() => { setActiveFilter("New In"); scrollToProducts(); }}>Shop New In</button>
              <a href="https://www.tiktok.com/@fashionfiestahub" target="_blank" rel="noreferrer" className="px-8 py-3.5 text-sm tracking-widest uppercase font-medium" style={{ background: "transparent", color: "var(--color-pearl)", border: "1px solid rgba(244,240,235,0.25)", cursor: "pointer", letterSpacing: "0.12em", textDecoration: "none" }}>View Lookbook</a>
            </div>
            <p className="mt-8 text-xs tracking-widest uppercase" style={{ color: "rgba(244,240,235,0.3)" }}>M-Pesa accepted &nbsp;·&nbsp; Nairobi delivery &nbsp;·&nbsp; Nationwide shipping</p>
          </div>
          <div className="relative hidden md:flex gap-4 justify-end items-center">
            <div className="relative overflow-hidden" style={{ width: 240, height: 360, background: "var(--color-charcoal)" }}>
              <img src={HERO_PRODUCTS[0].img} alt={HERO_PRODUCTS[0].name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
              <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: "linear-gradient(to top, rgba(14,14,15,0.9), transparent)" }}>
                <span className="text-xs tracking-widest uppercase block mb-1" style={{ color: "var(--color-champagne)" }}>{HERO_PRODUCTS[0].tag}</span>
                <p className="text-sm font-medium" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-display)" }}>{HERO_PRODUCTS[0].name}</p>
              </div>
            </div>
            <div className="relative overflow-hidden mt-16" style={{ width: 200, height: 300, background: "var(--color-charcoal)" }}>
              <img src={HERO_PRODUCTS[1].img} alt={HERO_PRODUCTS[1].name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
              <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: "linear-gradient(to top, rgba(14,14,15,0.9), transparent)" }}>
                <span className="text-xs tracking-widest uppercase block mb-1" style={{ color: "var(--color-champagne)" }}>{HERO_PRODUCTS[1].tag}</span>
                <p className="text-sm font-medium" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-display)" }}>{HERO_PRODUCTS[1].name}</p>
              </div>
            </div>
            <div className="absolute -left-4 top-8 bottom-8 w-px" style={{ background: "linear-gradient(to bottom, transparent, var(--color-champagne), transparent)" }} />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16" style={{ background: "var(--color-charcoal)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: "1px", background: "rgba(201,169,110,0.15)" }}>
            {CATEGORIES.map((cat) => (
              <div key={cat.label} className="relative overflow-hidden group cursor-pointer" style={{ background: "var(--color-charcoal)", aspectRatio: "3/4", maxHeight: 480 }}>
                <img src={cat.img} alt={cat.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-80" style={{ background: "linear-gradient(to top, rgba(14,14,15,0.8) 0%, rgba(14,14,15,0.1) 60%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: "var(--color-champagne)" }}>{cat.count}</p>
                  <h3 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>{cat.label}</h3>
                  <div className="mt-3 text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2" style={{ color: "var(--color-champagne)" }}>
                    Shop Now <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-20" style={{ background: "var(--color-obsidian)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: "var(--color-champagne)" }}>Curated for You</p>
              <h2 className="text-4xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>The Collection</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)} className="px-4 py-1.5 text-xs tracking-widest uppercase transition-all duration-200" style={{ background: activeFilter === f ? "var(--color-champagne)" : "transparent", color: activeFilter === f ? "var(--color-obsidian)" : "rgba(244,240,235,0.55)", border: `1px solid ${activeFilter === f ? "var(--color-champagne)" : "rgba(244,240,235,0.15)"}`, cursor: "pointer", letterSpacing: "0.12em" }}>{f}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => (
              <div key={product.id} className="group relative">
                <div className="relative overflow-hidden mb-4" style={{ aspectRatio: "3/4", background: "var(--color-charcoal-2)" }}>
                  <img src={product.img} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {product.tag && <span className="absolute top-4 left-4 text-xs tracking-widest uppercase px-2.5 py-1" style={{ background: product.tag === "Sale" ? "var(--color-champagne)" : "rgba(14,14,15,0.85)", color: product.tag === "Sale" ? "var(--color-obsidian)" : "var(--color-pearl)", letterSpacing: "0.12em" }}>{product.tag}</span>}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(to top, rgba(14,14,15,0.7) 0%, transparent 50%)" }}>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2.5 text-xs tracking-widest uppercase font-medium" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", border: "none", cursor: "pointer", letterSpacing: "0.12em" }} onClick={() => addToCart(product)}>Add to Bag</button>
                      <button aria-label="Wishlist" className="w-10 flex items-center justify-center" style={{ background: wishlist.includes(product.id) ? "var(--color-champagne)" : "rgba(14,14,15,0.8)", border: "1px solid rgba(244,240,235,0.2)", color: wishlist.includes(product.id) ? "var(--color-obsidian)" : "var(--color-pearl)", cursor: "pointer" }} onClick={() => toggleWishlist(product.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={wishlist.includes(product.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: "var(--color-mist)" }}>{product.category}</p>
                <h3 className="text-base mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)", fontWeight: 500 }}>{product.name}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-base" style={{ color: product.originalPrice ? "var(--color-champagne)" : "var(--color-pearl)", fontWeight: 500 }}>{product.price}</span>
                  {product.originalPrice && <span className="text-sm line-through" style={{ color: "var(--color-mist)" }}>{product.originalPrice}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button className="px-10 py-3.5 text-sm tracking-widest uppercase transition-all duration-200" style={{ background: "transparent", color: "var(--color-pearl)", border: "1px solid rgba(244,240,235,0.2)", cursor: "pointer", letterSpacing: "0.12em" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-champagne)"; (e.currentTarget as HTMLElement).style.color = "var(--color-champagne)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(244,240,235,0.2)"; (e.currentTarget as HTMLElement).style.color = "var(--color-pearl)"; }}
              onClick={() => { setActiveFilter("All"); scrollToProducts(); }}>
              View All Pieces
            </button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="relative overflow-hidden py-24" style={{ background: "var(--color-charcoal)" }}>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative overflow-hidden" style={{ aspectRatio: "4/5", background: "var(--color-charcoal-2)" }}>
            <img src="https://images.unsplash.com/photo-1508418717103-8b56bcf03360?w=700&h=875&fit=crop&auto=format" alt="African women in fashion" className="w-full h-full object-cover" />
            <div className="absolute bottom-8 right-8 px-6 py-4" style={{ background: "var(--color-obsidian)", borderLeft: "2px solid var(--color-champagne)" }}>
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--color-champagne)" }}>Proudly Kenyan</p>
              <p className="text-sm" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-display)" }}>Fashion Fiesta Hub</p>
            </div>
          </div>
          <div>
            <p className="text-xs tracking-[0.3em] uppercase mb-5" style={{ color: "var(--color-champagne)" }}>Our Story</p>
            <h2 className="font-semibold mb-6" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3.5rem)", color: "var(--color-pearl)", lineHeight: 1.15 }}>
              Fashion made for <em style={{ color: "var(--color-champagne)" }}>African women</em>, by Africans
            </h2>
            <p className="text-base leading-relaxed mb-5" style={{ color: "rgba(244,240,235,0.6)", fontWeight: 300 }}>Fashion Fiesta Hub was founded in Nairobi with one vision — to give Kenyan women access to stunning, affordable fashion that reflects their beauty, culture, and confidence.</p>
            <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(244,240,235,0.6)", fontWeight: 300 }}>From casual daywear to statement evening pieces, every item is chosen with the modern Kenyan woman in mind.</p>
            <div className="h-px mb-8" style={{ background: "linear-gradient(to right, var(--color-champagne), transparent)" }} />
            <div className="grid grid-cols-3 gap-6">
              {[["500+", "Happy clients"], ["3", "Years in Nairobi"], ["4.9★", "Customer rating"]].map(([val, label]) => (
                <div key={label}>
                  <p className="text-3xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-champagne)" }}>{val}</p>
                  <p className="text-xs tracking-wide" style={{ color: "rgba(244,240,235,0.5)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Order Tracker */}
      <section id="my-orders" className="py-20" style={{ background: "var(--color-charcoal)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12 text-center">
            <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: "var(--color-champagne)" }}>Fashion Fiesta Hub</p>
            <h2 className="text-4xl font-semibold mb-4" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>My Orders</h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "rgba(244,240,235,0.5)", fontWeight: 300 }}>Enter your unique client code to view all your orders and totals.</p>
          </div>
          <form onSubmit={handleOrderLookup} className="flex gap-0 max-w-md mx-auto mb-4">
            <input type="text" value={orderInput} onChange={(e) => { setOrderInput(e.target.value); setOrderError(false); }} placeholder="Enter client code e.g. FFH-001" className="flex-1 px-5 py-3.5 text-sm outline-none uppercase tracking-widest" style={{ background: "rgba(244,240,235,0.05)", border: `1px solid ${orderError ? "#f87171" : "rgba(201,169,110,0.25)"}`, borderRight: "none", color: "var(--color-pearl)" }} />
            <button type="submit" className="px-6 py-3.5 text-xs tracking-widest uppercase font-medium whitespace-nowrap" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", border: "none", cursor: "pointer", letterSpacing: "0.12em" }}>Look Up</button>
          </form>
          {orderError && <p className="text-center text-xs mb-8" style={{ color: "#f87171" }}>No account found for that code. Please check and try again.</p>}
          {!orderError && !clientRecord && <p className="text-center text-xs mt-2 mb-8" style={{ color: "rgba(244,240,235,0.25)" }}>Demo codes: FFH-001 · FFH-002 · FFH-003</p>}
          {clientRecord && (
            <div className="mt-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 mb-6" style={{ background: "rgba(201,169,110,0.07)", border: "1px solid rgba(201,169,110,0.2)" }}>
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: "var(--color-champagne)" }}>Client Account</p>
                  <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>{clientRecord.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(244,240,235,0.4)" }}>Client Code</p>
                  <p className="text-lg font-mono font-semibold" style={{ color: "var(--color-champagne)" }}>{orderCode}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-px mb-8" style={{ background: "rgba(201,169,110,0.1)" }}>
                {[
                  ["Total Orders", clientRecord.orders.length.toString()],
                  ["Total Items", clientRecord.orders.flatMap((o) => o.items).reduce((s, i) => s + i.qty, 0).toString()],
                  ["Total Spent", "KSh " + clientRecord.orders.flatMap((o) => o.items).reduce((s, i) => s + i.price * i.qty, 0).toLocaleString()],
                ].map(([label, val]) => (
                  <div key={label} className="text-center py-5" style={{ background: "var(--color-charcoal)" }}>
                    <p className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-champagne)" }}>{val}</p>
                    <p className="text-xs tracking-wide" style={{ color: "rgba(244,240,235,0.4)" }}>{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-5">
                {clientRecord.orders.map((order) => {
                  const orderTotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
                  const { bg, color } = STATUS_STYLE[order.status];
                  return (
                    <div key={order.id} style={{ background: "rgba(244,240,235,0.03)", border: "1px solid rgba(244,240,235,0.08)" }}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b" style={{ borderColor: "rgba(244,240,235,0.07)" }}>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-mono font-semibold" style={{ color: "var(--color-champagne)" }}>{order.id}</span>
                          <span className="text-xs px-2.5 py-1 tracking-widest uppercase" style={{ background: bg, color }}>{order.status}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-xs" style={{ color: "rgba(244,240,235,0.4)" }}>{order.date}</span>
                          <span className="text-base font-semibold" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-display)" }}>KSh {orderTotal.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="px-6 py-4">
                        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                          <thead>
                            <tr>{["Item", "Category", "Qty", "Unit Price", "Subtotal"].map((h) => <th key={h} className="text-left pb-3 text-xs tracking-widest uppercase" style={{ color: "rgba(244,240,235,0.3)", fontWeight: 400, borderBottom: "1px solid rgba(244,240,235,0.07)" }}>{h}</th>)}</tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="py-3 pr-4" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-display)", fontWeight: 500 }}>{item.name}</td>
                                <td className="py-3 pr-4 text-xs tracking-wide uppercase" style={{ color: "var(--color-mist)" }}>{item.category}</td>
                                <td className="py-3 pr-4" style={{ color: "rgba(244,240,235,0.6)" }}>×{item.qty}</td>
                                <td className="py-3 pr-4" style={{ color: "rgba(244,240,235,0.6)" }}>KSh {item.price.toLocaleString()}</td>
                                <td className="py-3 font-semibold" style={{ color: "var(--color-champagne)" }}>KSh {(item.price * item.qty).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={4} className="pt-3 text-right text-xs tracking-widest uppercase pr-4" style={{ color: "rgba(244,240,235,0.35)", borderTop: "1px solid rgba(244,240,235,0.07)" }}>Order Total</td>
                              <td className="pt-3 text-base font-bold" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-display)", borderTop: "1px solid rgba(244,240,235,0.07)" }}>KSh {orderTotal.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 text-center">
                <button onClick={() => { setOrderCode(""); setOrderInput(""); setOrderError(false); }} style={{ background: "none", border: "none", color: "rgba(244,240,235,0.3)", cursor: "pointer", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-champagne)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(244,240,235,0.3)")}>
                  ← Look up a different code
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 text-center" style={{ background: "linear-gradient(135deg, #1a1a1d 0%, #0e0e0f 100%)", borderTop: "1px solid rgba(201,169,110,0.15)" }}>
        <div className="max-w-xl mx-auto px-6">
          <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "var(--color-champagne)" }}>Stay connected</p>
          <h2 className="text-3xl font-semibold mb-4" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>The Fiesta Edit</h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "rgba(244,240,235,0.5)", fontWeight: 300 }}>New drops, styling tips, and exclusive deals — straight to your inbox every Friday.</p>
          <form className="flex gap-0" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Your email address" className="flex-1 px-5 py-3.5 text-sm outline-none" style={{ background: "rgba(244,240,235,0.06)", border: "1px solid rgba(201,169,110,0.25)", borderRight: "none", color: "var(--color-pearl)" }} />
            <button type="submit" className="px-6 py-3.5 text-xs tracking-widest uppercase font-medium whitespace-nowrap" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", border: "none", cursor: "pointer", letterSpacing: "0.12em" }}>Subscribe</button>
          </form>
          <p className="mt-4 text-xs" style={{ color: "rgba(244,240,235,0.25)" }}>No spam, ever. Unsubscribe at any time.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t" style={{ background: "var(--color-obsidian)", borderColor: "rgba(201,169,110,0.1)" }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <p className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-champagne)" }}>Fashion Fiesta Hub</p>
            <p className="text-xs mb-3" style={{ color: "rgba(244,240,235,0.35)" }}>Nairobi, Kenya</p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(244,240,235,0.4)", fontWeight: 300 }}>Ladies fashion for the bold, vibrant Kenyan woman. Free delivery within Nairobi on orders over KSh 3,000.</p>
          </div>
          {[
            { title: "Shop", links: ["New In", "Dresses", "Tops", "Outerwear", "Sale"] },
            { title: "Help", links: ["Sizing Guide", "Shipping & Returns", "Contact Us", "FAQ"] },
            { title: "Find Us", links: ["Instagram", "TikTok", "WhatsApp Us", "Newsletter"] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-xs tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(244,240,235,0.4)" }}>{col.title}</p>
              <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
                {col.links.map((link) => {
                  const helpPage = HELP_CONTENT[link];
                  const destination = link === "WhatsApp Us" ? "https://wa.me/254798638605" : link === "TikTok" ? "https://www.tiktok.com/@fashionfiestahub" : "#";
                  return (
                    <li key={link}>
                      {link === "Contact Us" ? (
                        <button type="button" onClick={() => setContactOpen(true)} className="text-sm transition-colors duration-200" style={{ color: "rgba(244,240,235,0.55)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-champagne)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(244,240,235,0.55)")}>{link}</button>
                      ) : helpPage ? (
                        <button type="button" onClick={() => setHelpOpen(link)} className="text-sm transition-colors duration-200" style={{ color: "rgba(244,240,235,0.55)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-champagne)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(244,240,235,0.55)")}>{link}</button>
                      ) : (
                        <a href={destination} target={destination === "#" ? undefined : "_blank"} rel={destination === "#" ? undefined : "noreferrer"} className="text-sm transition-colors duration-200" style={{ color: "rgba(244,240,235,0.55)", textDecoration: "none" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-champagne)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(244,240,235,0.55)")}>{link}</a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 border-t" style={{ borderColor: "rgba(201,169,110,0.1)" }}>
          <p className="text-xs" style={{ color: "rgba(244,240,235,0.25)" }}>© 2026 Fashion Fiesta Hub. All rights reserved. Nairobi, Kenya.</p>
          <div className="flex items-center gap-4">
            <p className="text-xs" style={{ color: "rgba(244,240,235,0.25)" }}>Privacy &nbsp;·&nbsp; Terms &nbsp;·&nbsp; Cookies</p>
            <Link to="/admin" className="text-xs px-3 py-1 transition-colors duration-200" style={{ color: "rgba(244,240,235,0.3)", border: "1px solid rgba(244,240,235,0.1)", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-champagne)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,169,110,0.3)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(244,240,235,0.3)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(244,240,235,0.1)"; }}>
              Admin
            </Link>
          </div>
        </div>
      </footer>

      {cartOpen && (
        <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setCartOpen(false)}>
          <aside className="absolute top-0 right-0 h-full w-full max-w-md p-6 overflow-y-auto" style={{ background: "var(--color-charcoal)", borderLeft: "1px solid rgba(201,169,110,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>Your Bag</h2>
              <button aria-label="Close cart" onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", color: "rgba(244,240,235,0.5)", cursor: "pointer", fontSize: "24px" }}>×</button>
            </div>
            {cartItems.length === 0 ? (
              <p className="text-sm" style={{ color: "rgba(244,240,235,0.5)" }}>Your bag is empty.</p>
            ) : (
              <>
                <div className="flex flex-col gap-5">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <img src={item.img} alt={item.name} className="w-20 h-24 object-cover" />
                      <div className="flex-1">
                        <div className="flex justify-between gap-3">
                          <h3 className="text-sm" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-display)" }}>{item.name}</h3>
                          <button onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`} style={{ background: "none", border: "none", color: "rgba(244,240,235,0.4)", cursor: "pointer" }}>×</button>
                        </div>
                        <p className="text-sm mt-2" style={{ color: "var(--color-champagne)" }}>KSh {item.price.toLocaleString()}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`} style={{ background: "none", border: "1px solid rgba(244,240,235,0.15)", color: "var(--color-pearl)", cursor: "pointer", width: 28, height: 28 }}>−</button>
                          <span className="text-sm" style={{ color: "var(--color-pearl)" }}>{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`} style={{ background: "none", border: "1px solid rgba(244,240,235,0.15)", color: "var(--color-pearl)", cursor: "pointer", width: 28, height: 28 }}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-5 border-t flex items-center justify-between" style={{ borderColor: "rgba(244,240,235,0.1)" }}>
                  <span className="text-sm uppercase tracking-widest" style={{ color: "rgba(244,240,235,0.5)" }}>Total</span>
                  <span className="text-xl font-semibold" style={{ color: "var(--color-champagne)", fontFamily: "var(--font-display)" }}>KSh {cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={() => { setCheckoutError(""); setCheckoutOpen(true); }} className="w-full mt-6 py-3.5 text-xs tracking-widest uppercase font-medium" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", border: "none", cursor: "pointer" }}>Checkout</button>
              </>
            )}
          </aside>
        </div>
      )}

      {helpOpen && (
        <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setHelpOpen(null)}>
          <aside className="absolute top-0 right-0 h-full w-full max-w-lg p-6 overflow-y-auto" style={{ background: "var(--color-charcoal)", borderLeft: "1px solid rgba(201,169,110,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>{HELP_CONTENT[helpOpen].title}</h2>
              <button aria-label={`Close ${helpOpen}`} onClick={() => setHelpOpen(null)} style={{ background: "none", border: "none", color: "rgba(244,240,235,0.5)", cursor: "pointer", fontSize: "24px" }}>×</button>
            </div>
            <div className="flex flex-col gap-7">
              {HELP_CONTENT[helpOpen].items.map((item) => (
                <div key={`${item.question ?? ""}${item.answer}`}>
                  {item.question && <h3 className="text-sm font-medium mb-2" style={{ color: "var(--color-champagne)" }}>{item.question}</h3>}
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(244,240,235,0.65)", fontWeight: 300 }}>{item.answer}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {contactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setContactOpen(false)}>
          <div className="w-full max-w-sm p-8 text-center" style={{ background: "var(--color-charcoal)", border: "1px solid rgba(201,169,110,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>Contact Us</h2>
              <button aria-label="Close contact dialog" onClick={() => setContactOpen(false)} style={{ background: "none", border: "none", color: "rgba(244,240,235,0.5)", cursor: "pointer", fontSize: "24px" }}>×</button>
            </div>
            <a href="https://wa.me/254798638605" target="_blank" rel="noreferrer" className="inline-block px-6 py-3 text-xs tracking-widest uppercase font-medium" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", textDecoration: "none" }}>Chat on WhatsApp</a>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <form onSubmit={placeOrder} className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" style={{ background: "var(--color-charcoal)", border: "1px solid rgba(201,169,110,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>Guest Checkout</h2>
              <button type="button" aria-label="Close checkout" onClick={() => setCheckoutOpen(false)} style={{ background: "none", border: "none", color: "rgba(244,240,235,0.5)", cursor: "pointer", fontSize: "24px" }}>×</button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                ["name", "Full name", "text"],
                ["phone", "Phone number", "tel"],
                ["email", "Email address", "email"],
                ["address", "Delivery address", "text"],
                ["notes", "Delivery notes (optional)", "text"],
              ].map(([field, label, type]) => (
                <label key={field} className="flex flex-col gap-2 text-xs tracking-widest uppercase" style={{ color: "rgba(244,240,235,0.4)" }}>
                  {label}
                  <input required={field !== "notes"} type={type} value={checkoutForm[field as keyof CheckoutForm]} onChange={(e) => setCheckoutForm({ ...checkoutForm, [field]: e.target.value })} className="px-3 py-2.5 text-sm normal-case tracking-normal outline-none" style={{ background: "rgba(244,240,235,0.05)", border: "1px solid rgba(244,240,235,0.12)", color: "var(--color-pearl)" }} />
                </label>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t flex items-center justify-between" style={{ borderColor: "rgba(244,240,235,0.1)" }}>
              <span className="text-sm" style={{ color: "rgba(244,240,235,0.5)" }}>Order total</span>
              <span className="text-xl font-semibold" style={{ color: "var(--color-champagne)" }}>KSh {cartTotal.toLocaleString()}</span>
            </div>
            {checkoutError && <p className="mt-4 text-sm" style={{ color: "#f87171" }}>{checkoutError}</p>}
            <button type="submit" className="w-full mt-6 py-3.5 text-xs tracking-widest uppercase font-medium" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", border: "none", cursor: "pointer" }}>Place Order</button>
          </form>
        </div>
      )}

      {orderConfirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-md p-8 text-center" style={{ background: "var(--color-charcoal)", border: "1px solid rgba(201,169,110,0.25)" }}>
            <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: "var(--color-champagne)" }}>Order confirmed</p>
            <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>Thank you, {orderConfirmation.name}</h2>
            <p className="text-sm mb-2" style={{ color: "rgba(244,240,235,0.6)" }}>Your order code is</p>
            <p className="text-2xl font-mono font-bold mb-6" style={{ color: "var(--color-champagne)" }}>{orderConfirmation.code}</p>
            <p className="text-sm mb-8" style={{ color: "rgba(244,240,235,0.6)" }}>{orderConfirmation.items} item(s) · KSh {orderConfirmation.total.toLocaleString()}</p>
            <button onClick={() => setOrderConfirmation(null)} className="px-6 py-3 text-xs tracking-widest uppercase font-medium" style={{ background: "var(--color-champagne)", color: "var(--color-obsidian)", border: "none", cursor: "pointer" }}>Continue Shopping</button>
          </div>
        </div>
      )}
    </div>
  );
}
