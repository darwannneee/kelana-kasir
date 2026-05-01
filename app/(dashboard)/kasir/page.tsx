"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createOrder } from "@/lib/actions/orders";
import { Product, CartItem } from "@/lib/types/database";
import { formatRupiah } from "@/lib/utils";
import {
  Banknote,
  CheckCircle2,
  History,
  Landmark,
  MessageSquareText,
  Minus,
  Plus,
  Printer,
  QrCode,
  Search,
  ShoppingCart,
  Store,
  X,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

type PaymentMethod = "cash" | "qris" | "transfer";

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

const CARD_COLORS = [
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-sky-50 text-sky-700 border-sky-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-rose-50 text-rose-700 border-rose-100",
  "bg-cyan-50 text-cyan-700 border-cyan-100",
  "bg-orange-50 text-orange-700 border-orange-100",
];

function getCardColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

function formatQuick(amount: number): string {
  if (amount >= 1_000_000) return `${amount / 1_000_000}jt`;
  return `${amount / 1_000}rb`;
}

const paymentLabels: Record<string, string> = {
  cash: "Cash",
  qris: "QRIS",
  transfer: "Transfer",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatReceiptDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cashierName, setCashierName] = useState("-");
  const [struk, setStruk] = useState<{
    orderNumber: string;
    createdAt: string;
    cashierName: string;
    customerName: string;
    items: CartItem[];
    total: number;
    method: string;
    paid: number;
    change: number;
  } | null>(null);

  const loadProducts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .order("name");
    setProducts(data || []);
    const { data: cats } = await supabase.from("categories").select("*").order("name");
    setCategories(cats || []);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    async function loadCashierName() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setCashierName(profile?.full_name || user.email?.split("@")[0] || "-");
    }

    loadCashierName();
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || p.category_id === selectedCategory;
    return matchSearch && matchCat;
  });

  function addToCart(product: Product) {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1, note: "" }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((c) => c.product.id === productId
        ? { ...c, quantity: Math.max(1, Math.min(c.quantity + delta, c.product.stock)) }
        : c)
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  }

  function updateNote(productId: string, note: string) {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, note } : item))
    );
  }

  const total = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const paid = parseInt(paymentAmount.replace(/\D/g, "")) || 0;
  const change = paid - total;

  async function handlePayment() {
    if (paymentMethod === "cash" && paid < total) return;
    setLoading(true);
    setPaymentError("");
    const items = cart.map((c) => ({
      productId: c.product.id,
      productName: c.product.name,
      quantity: c.quantity,
      unitPrice: c.product.price,
      note: c.note,
    }));
    const normalizedCustomerName = customerName.trim() || "Umum";
    const result = await createOrder(
      items,
      paymentMethod,
      paymentMethod === "cash" ? paid : total,
      normalizedCustomerName
    );
    if (result.error) {
      setPaymentError(result.error);
    }
    if (result.order) {
      setStruk({
        orderNumber: result.order.order_number,
        createdAt: result.order.created_at,
        cashierName,
        customerName: result.order.customer_name || normalizedCustomerName,
        items: [...cart],
        total,
        method: paymentMethod,
        paid: paymentMethod === "cash" ? paid : total,
        change: paymentMethod === "cash" ? change : 0,
      });
      setCart([]);
      setPaymentOpen(false);
      setPaymentAmount("");
      setCustomerName("");
      await loadProducts();
    }
    setLoading(false);
  }

  function printReceipt() {
    if (!struk) return;

    const receiptDate = formatReceiptDate(struk.createdAt);
    const itemCount = struk.items.reduce((sum, item) => sum + item.quantity, 0);
    const customerRows = struk.items
      .map((item) => {
        const note = item.note?.trim();

        return `
          <div class="item">
            <div class="item-main">
              <div>
                <div class="item-name">${escapeHtml(item.product.name)}</div>
                <div class="muted">${item.quantity} x ${formatRupiah(item.product.price)}</div>
              </div>
              <div class="price">${formatRupiah(item.product.price * item.quantity)}</div>
            </div>
            ${note ? `<div class="note">Note: ${escapeHtml(note)}</div>` : ""}
          </div>
        `;
      })
      .join("");

    const kitchenRows = struk.items
      .map((item) => {
        const note = item.note?.trim();

        return `
          <div class="kitchen-item">
            <div class="qty">${item.quantity}x</div>
            <div>
              <div class="kitchen-name">${escapeHtml(item.product.name)}</div>
              ${note ? `<div class="kitchen-note">Note: ${escapeHtml(note)}</div>` : ""}
            </div>
          </div>
        `;
      })
      .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title> </title>
          <style>
            @page {
              size: 58mm 210mm;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              width: 58mm;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
              font-size: 9px;
              line-height: 1.35;
            }

            .receipt {
              width: 58mm;
              padding: 3mm;
              background: #fff;
            }

            .receipt + .receipt {
              break-before: page;
              page-break-before: always;
            }

            .center { text-align: center; }
            .brand { font-size: 15px; font-weight: 800; letter-spacing: 0; }
            .copy-label {
              display: inline-block;
              margin-top: 4px;
              padding: 2px 6px;
              border: 1px solid #000;
              border-radius: 999px;
              font-size: 8px;
              font-weight: 800;
            }

            .muted { color: #333; }
            .divider {
              border: 0;
              border-top: 1px dashed #000;
              margin: 8px 0;
            }

            .row,
            .item-main,
            .total-row {
              display: flex;
              justify-content: space-between;
              gap: 8px;
            }

            .item {
              margin-bottom: 7px;
            }

            .item-name {
              font-weight: 800;
            }

            .price {
              flex-shrink: 0;
              font-weight: 800;
              text-align: right;
            }

            .note {
              margin-top: 2px;
              padding-left: 8px;
              color: #111;
              font-size: 9px;
            }

            .total-row {
              font-size: 11px;
              font-weight: 900;
            }

            .footer {
              margin-top: 10px;
              text-align: center;
              font-size: 9px;
            }

            .kitchen-title {
              font-size: 16px;
              font-weight: 900;
            }

            .kitchen-item {
              display: grid;
              grid-template-columns: 20px 1fr;
              gap: 6px;
              padding: 8px 0;
              border-bottom: 1px dashed #000;
            }

            .qty {
              font-size: 14px;
              font-weight: 900;
            }

            .kitchen-name {
              font-size: 12px;
              font-weight: 900;
            }

            .kitchen-note {
              margin-top: 3px;
              font-size: 10px;
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <section class="receipt">
            <div class="center">
              <div class="brand">KelanaRasa</div>
              <div class="muted">Struk Pembayaran</div>
              <div class="copy-label">CUSTOMER COPY</div>
            </div>

            <hr class="divider" />

            <div class="row"><span>No Order</span><strong>${escapeHtml(struk.orderNumber)}</strong></div>
            <div class="row"><span>Tanggal</span><strong>${receiptDate}</strong></div>
            <div class="row"><span>Pemesan</span><strong>${escapeHtml(struk.customerName)}</strong></div>
            <div class="row"><span>Kasir</span><strong>${escapeHtml(struk.cashierName)}</strong></div>
            <div class="row"><span>Metode</span><strong>${paymentLabels[struk.method] || struk.method}</strong></div>
            <div class="row"><span>Total Item</span><strong>${itemCount}</strong></div>

            <hr class="divider" />

            ${customerRows}

            <hr class="divider" />

            <div class="total-row"><span>Total</span><span>${formatRupiah(struk.total)}</span></div>
            <div class="row"><span>Bayar</span><strong>${formatRupiah(struk.paid)}</strong></div>
            ${struk.method === "cash" ? `<div class="row"><span>Kembali</span><strong>${formatRupiah(struk.change)}</strong></div>` : ""}

            <hr class="divider" />

            <div class="footer">
              Terima kasih sudah berbelanja.<br />
              Barang yang sudah dibeli tidak dapat dikembalikan.
            </div>
          </section>

          <section class="receipt">
            <div class="center">
              <div class="brand">KelanaRasa</div>
              <div class="kitchen-title">ORDER DAPUR</div>
              <div class="copy-label">KITCHEN COPY</div>
            </div>

            <hr class="divider" />

            <div class="row"><span>No Order</span><strong>${escapeHtml(struk.orderNumber)}</strong></div>
            <div class="row"><span>Waktu</span><strong>${receiptDate}</strong></div>
            <div class="row"><span>Pemesan</span><strong>${escapeHtml(struk.customerName)}</strong></div>
            <div class="row"><span>Kasir</span><strong>${escapeHtml(struk.cashierName)}</strong></div>
            <div class="row"><span>Total Item</span><strong>${itemCount}</strong></div>

            <hr class="divider" />

            ${kitchenRows}

            <div class="footer">Cek note sebelum proses pesanan.</div>
          </section>
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    const frameDocument = iframe.contentDocument || frameWindow?.document;
    if (!frameWindow || !frameDocument) {
      iframe.remove();
      return;
    }

    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();

    window.setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
      window.setTimeout(() => iframe.remove(), 1000);
    }, 100);
  }

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col gap-4 md:h-screen md:flex-row md:gap-0">
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:rounded-none md:border-y-0 md:border-l-0 md:shadow-none">
        <div className="border-b border-zinc-100 bg-white px-4 py-4 md:px-5 md:pt-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Point of sale</p>
              <h1 className="mt-1 text-2xl font-bold text-zinc-950">Kasir</h1>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-500">
              <Store className="h-4 w-4 text-emerald-700" />
              {filtered.length} produk siap jual
            </div>
            <Link
              href="/kasir/recent"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:border-emerald-200 hover:text-emerald-700"
            >
              <History className="h-4 w-4" />
              Recent Order
            </Link>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 pl-10 pr-4 text-sm font-medium text-zinc-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          {categories.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  !selectedCategory
                    ? "bg-zinc-900 text-white"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
                }`}
              >
                Semua
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    selectedCategory === c.id
                      ? "bg-zinc-900 text-white"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100">
                <Search className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-500">Tidak ada produk</p>
              <p className="mt-1 text-xs text-zinc-400">Coba ubah pencarian atau kategori</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filtered.map((product) => {
                const inCart = cart.find((c) => c.product.id === product.id);
                const outOfStock = product.stock <= 0;
                const colorClass = getCardColor(product.name);

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                    className={`rounded-lg border bg-white p-3.5 text-left transition-all duration-150 ${
                      outOfStock
                        ? "opacity-40 cursor-not-allowed border-zinc-200"
                        : inCart
                          ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-sm"
                          : "border-zinc-200 hover:border-emerald-200 hover:shadow-md"
                    }`}
                  >
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold ${colorClass}`}>
                      {product.name.charAt(0).toUpperCase()}
                    </div>

                    <p className="mb-1.5 line-clamp-2 text-xs font-bold leading-snug text-zinc-950">
                      {product.name}
                    </p>
                    <p className="tabular text-sm font-bold text-emerald-700">{formatRupiah(product.price)}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-[10px] font-medium ${product.stock < 5 ? "text-rose-500" : "text-zinc-400"}`}>
                        {product.stock} stok
                      </span>
                      {inCart && (
                        <span className="rounded-md bg-[#11120f] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          ×{inCart.quantity}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col rounded-lg border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:w-96 md:rounded-none md:border-y-0 md:border-r-0 md:shadow-none">
        <div className="border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-zinc-950">Keranjang</h2>
            {totalItems > 0 && (
              <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-md bg-[#11120f] px-2 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </div>
        </div>

        <div className="min-h-64 flex-1 overflow-auto px-4 py-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                <ShoppingCart className="h-5 w-5 text-zinc-300" />
              </div>
              <p className="text-xs font-semibold text-zinc-400">Keranjang kosong</p>
              <p className="mt-0.5 text-[11px] text-zinc-300">Tap produk untuk menambah</p>
            </div>
          ) : (
            <div className="space-y-1">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="border-b border-zinc-50 py-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold leading-snug text-zinc-950">
                        {item.product.name}
                      </p>
                      <p className="tabular mt-0.5 text-[11px] text-zinc-400">
                        {formatRupiah(item.product.price)}
                      </p>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 transition-colors hover:bg-zinc-200"
                      >
                        <Minus className="h-3 w-3 text-zinc-600" />
                      </button>
                      <span className="tabular w-6 text-center text-xs font-bold text-zinc-950">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 transition-colors hover:bg-zinc-200"
                      >
                        <Plus className="h-3 w-3 text-zinc-600" />
                      </button>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-1">
                      <span className="tabular w-16 text-right text-xs font-bold text-zinc-800">
                        {formatRupiah(item.product.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-300 transition-all hover:bg-rose-50 hover:text-rose-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-zinc-100 bg-zinc-50/70 px-2.5 py-2">
                    <MessageSquareText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />
                    <textarea
                      value={item.note || ""}
                      onChange={(event) => updateNote(item.product.id, event.target.value)}
                      placeholder="Note item, contoh: pedas, tanpa gula..."
                      rows={2}
                      className="min-h-9 flex-1 resize-none bg-transparent text-xs font-medium leading-5 text-zinc-700 outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-100 px-5 py-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-zinc-400">{totalItems} item</span>
            <span className="text-xs text-zinc-400">{cart.length} jenis</span>
          </div>
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-zinc-500">Total</span>
            <span className="tabular text-2xl font-bold text-zinc-950">{formatRupiah(total)}</span>
          </div>
          <Button
            onClick={() => {
              setPaymentError("");
              setPaymentOpen(true);
            }}
            disabled={cart.length === 0}
            className="w-full py-3"
          >
            Bayar Sekarang
          </Button>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Pembayaran" size="sm">
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Pembayaran</p>
            <p className="tabular text-3xl font-bold text-zinc-950">{formatRupiah(total)}</p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Nama Pemesan
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Contoh: Budi / Meja 4"
              className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm font-semibold text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Metode Bayar</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "cash", label: "Cash", icon: Banknote },
                { value: "qris", label: "QRIS", icon: QrCode },
                { value: "transfer", label: "Transfer", icon: Landmark },
              ].map((method) => {
                const Icon = method.icon;
                const active = paymentMethod === method.value;

                return (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value as PaymentMethod)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-bold transition-all ${
                      active
                        ? "border-[#11120f] bg-[#11120f] text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-emerald-300" : "text-zinc-400"}`} />
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMethod === "cash" && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Nominal Bayar</p>
              <div className="mb-3 grid grid-cols-3 gap-1.5">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setPaymentAmount(String(amount))}
                    className={`rounded-lg border py-1.5 text-xs font-bold transition-all ${
                      paid === amount
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    {formatQuick(amount)}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Atau ketik nominal..."
                value={paymentAmount ? formatRupiah(parseInt(paymentAmount) || 0) : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setPaymentAmount(raw);
                }}
                className="tabular h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm font-bold text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
              {paid >= total && paid > 0 && (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-semibold text-emerald-700">Kembalian</p>
                  <p className="tabular text-base font-bold text-emerald-700">{formatRupiah(change)}</p>
                </div>
              )}
              {paid > 0 && paid < total && (
                <p className="mt-2 text-center text-xs font-semibold text-rose-500">
                  Kurang {formatRupiah(total - paid)}
                </p>
              )}
            </div>
          )}

          {paymentError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {paymentError}
            </div>
          )}

          <Button
            onClick={handlePayment}
            loading={loading}
            disabled={paymentMethod === "cash" && paid < total}
            className="w-full py-3"
          >
            Proses Pembayaran
          </Button>
        </div>
      </Modal>

      {/* ── Struk Modal ── */}
      {struk && (
        <Modal open={!!struk} onClose={() => setStruk(null)} title="Transaksi Berhasil" size="sm">
          <div className="text-center mb-5">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-zinc-950">Pembayaran Berhasil!</p>
            <p className="mt-0.5 text-xs text-zinc-400">#{struk.orderNumber}</p>
          </div>

          <div id="struk-print" className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm">
            <p className="mb-0.5 text-center text-base font-bold">KelanaRasa</p>
            <p className="mb-1 text-center text-xs text-zinc-400">{formatReceiptDate(struk.createdAt)}</p>
            <p className="mb-1 text-center text-xs text-zinc-400">Pemesan: {struk.customerName}</p>
            <p className="mb-3 text-center text-xs text-zinc-400">Kasir: {struk.cashierName}</p>
            <p className="mb-2 text-[11px] text-zinc-400">No: {struk.orderNumber}</p>
            <hr className="my-2 border-dashed border-zinc-300" />
            {struk.items.map((item) => (
              <div key={item.product.id} className="mb-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="mr-2 truncate text-zinc-700">{item.product.name} ×{item.quantity}</span>
                  <span className="tabular text-zinc-950">{formatRupiah(item.product.price * item.quantity)}</span>
                </div>
                {item.note?.trim() && (
                  <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">Note: {item.note.trim()}</p>
                )}
              </div>
            ))}
            <hr className="my-2 border-dashed border-zinc-300" />
            <div className="flex justify-between font-bold text-zinc-950">
              <span>Total</span>
              <span className="tabular">{formatRupiah(struk.total)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
              <span>Bayar ({struk.method.toUpperCase()})</span>
              <span className="tabular">{formatRupiah(struk.paid)}</span>
            </div>
            {struk.method === "cash" && (
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Kembalian</span>
                <span className="tabular">{formatRupiah(struk.change)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={printReceipt} className="flex-1">
              <Printer className="w-3.5 h-3.5" /> Cetak
            </Button>
            <Button onClick={() => setStruk(null)} className="flex-1">
              Transaksi Baru
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
