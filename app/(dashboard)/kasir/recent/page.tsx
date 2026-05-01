import Link from "next/link";
import { ArrowLeft, Clock3, MessageSquareText, ReceiptText, ShoppingBag } from "lucide-react";
import { requireActiveProfile } from "@/lib/auth/guards";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import RecentOrderPrintButton from "./RecentOrderPrintButton";

const methodLabel: Record<string, string> = { cash: "Cash", qris: "QRIS", transfer: "Transfer" };

type RecentOrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  note?: string | null;
};

type RecentOrder = {
  id: string;
  order_number: string;
  customer_name?: string | null;
  total_amount: number;
  payment_method: string;
  payment_amount: number;
  change_amount: number;
  status: string;
  created_at: string;
  cashier?: { full_name: string } | null;
  order_items?: RecentOrderItem[];
};

export default async function RecentKasirOrdersPage() {
  const { supabase, user, profile } = await requireActiveProfile();

  let query = supabase
    .from("orders")
    .select("*, cashier:profiles(full_name), order_items(*)")
    .order("created_at", { ascending: false })
    .limit(30);

  if (profile.role === "kasir") {
    query = query.eq("cashier_id", user.id);
  }

  const { data } = await query;
  const orders = (data || []) as RecentOrder[];
  const completed = orders.filter((order) => order.status === "completed");
  const totalRecent = completed.reduce((sum, order) => sum + order.total_amount, 0);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/kasir"
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:text-zinc-950"
            aria-label="Kembali ke kasir"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Point of sale</p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-950">Recent Order</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {profile.role === "kasir" ? "30 transaksi terakhir dari akun kasir ini." : "30 transaksi terbaru dari semua kasir."}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <ReceiptText className="h-4 w-4 text-emerald-700" />
              Transaksi
            </div>
            <p className="tabular text-xl font-bold text-zinc-950">{orders.length}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <ShoppingBag className="h-4 w-4 text-emerald-700" />
              Total Recent
            </div>
            <p className="tabular text-xl font-bold text-zinc-950">{formatRupiah(totalRecent)}</p>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-16 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100">
            <Clock3 className="h-5 w-5 text-zinc-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-500">Belum ada recent order</p>
          <p className="mt-1 text-xs text-zinc-400">Transaksi yang selesai akan muncul di sini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-xs font-bold text-emerald-700">{order.order_number}</p>
                  <p className="mt-1 text-xs font-medium text-zinc-500">{formatDateTime(order.created_at)}</p>
                  <p className="mt-1 text-xs font-bold text-zinc-700">Pemesan: {order.customer_name || "Umum"}</p>
                  {profile.role === "owner" && (
                    <p className="mt-1 text-xs font-medium text-zinc-400">Kasir: {order.cashier?.full_name || "-"}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <RecentOrderPrintButton order={order} />
                  <Badge variant="info">{methodLabel[order.payment_method] || order.payment_method}</Badge>
                  <Badge variant={order.status === "completed" ? "success" : "danger"}>
                    {order.status === "completed" ? "Selesai" : "Batal"}
                  </Badge>
                  <span className="tabular rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-bold text-zinc-950">
                    {formatRupiah(order.total_amount)}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-zinc-100 px-5">
                {(order.order_items || []).map((item) => (
                  <div key={item.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-950">{item.product_name}</p>
                        <p className="tabular mt-1 text-xs text-zinc-500">
                          {item.quantity} x {formatRupiah(item.unit_price)}
                        </p>
                      </div>
                      <p className="tabular flex-shrink-0 text-sm font-bold text-zinc-950">
                        {formatRupiah(item.subtotal)}
                      </p>
                    </div>
                    {item.note && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600">
                        <MessageSquareText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />
                        <span>{item.note}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1 border-t border-zinc-100 bg-zinc-50/70 px-5 py-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                <span>Dibayar: <span className="tabular font-bold text-zinc-700">{formatRupiah(order.payment_amount)}</span></span>
                {order.payment_method === "cash" && (
                  <span>Kembalian: <span className="tabular font-bold text-zinc-700">{formatRupiah(order.change_amount)}</span></span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
