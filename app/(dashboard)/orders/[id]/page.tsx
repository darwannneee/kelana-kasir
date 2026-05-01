import { requireOwnerPage } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowLeft, ReceiptText } from "lucide-react";

const methodLabel: Record<string, string> = { cash: "Cash", qris: "QRIS", transfer: "Transfer" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireOwnerPage();

  const { data: order } = await supabase
    .from("orders")
    .select("*, cashier:profiles(full_name), order_items(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  return (
    <div className="max-w-3xl p-4 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/orders" className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-colors hover:text-zinc-950">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Order detail</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-950">Detail Pesanan</h1>
          <p className="mt-1 font-mono text-xs font-semibold text-emerald-700">{order.order_number}</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-950">Ringkasan Transaksi</p>
            <p className="text-xs text-zinc-500">Detail kasir, pembayaran, dan item pesanan.</p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide font-semibold text-zinc-400">Tanggal</p>
            <p className="mt-1 font-semibold text-zinc-950">{formatDateTime(order.created_at)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide font-semibold text-zinc-400">Kasir</p>
            <p className="mt-1 font-semibold text-zinc-950">{order.cashier?.full_name || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide font-semibold text-zinc-400 mb-1.5">Metode Bayar</p>
            <Badge variant="info">{methodLabel[order.payment_method]}</Badge>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide font-semibold text-zinc-400 mb-1.5">Status</p>
            <Badge variant={order.status === "completed" ? "success" : "danger"}>
              {order.status === "completed" ? "Selesai" : "Dibatalkan"}
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-t border-zinc-100 text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Produk</th>
              <th className="py-3 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Qty</th>
              <th className="py-3 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Harga</th>
              <th className="py-3 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {order.order_items?.map((item: { id: string; product_name: string; quantity: number; unit_price: number; subtotal: number; note?: string | null }) => (
              <tr key={item.id}>
                <td className="py-3">
                  <p className="font-semibold text-zinc-950">{item.product_name}</p>
                  {item.note && <p className="mt-1 text-xs font-medium text-zinc-500">Note: {item.note}</p>}
                </td>
                <td className="py-3 text-center text-zinc-500 tabular">{item.quantity}</td>
                <td className="py-3 text-right text-zinc-500 tabular">{formatRupiah(item.unit_price)}</td>
                <td className="py-3 text-right font-semibold text-zinc-900 tabular">{formatRupiah(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="border-t border-zinc-200 pt-4 mt-2 space-y-2 text-sm">
          <div className="tabular flex justify-between text-base font-bold text-zinc-950">
            <span>Total</span>
            <span>{formatRupiah(order.total_amount)}</span>
          </div>
          <div className="flex justify-between text-zinc-500 tabular">
            <span>Dibayar ({methodLabel[order.payment_method]})</span>
            <span>{formatRupiah(order.payment_amount)}</span>
          </div>
          {order.payment_method === "cash" && (
            <div className="flex justify-between text-zinc-500 tabular">
              <span>Kembalian</span>
              <span>{formatRupiah(order.change_amount)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
