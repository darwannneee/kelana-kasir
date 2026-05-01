import { requireOwnerPage } from "@/lib/auth/guards";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { ClipboardList, ReceiptText } from "lucide-react";

const methodLabel: Record<string, string> = { cash: "Cash", qris: "QRIS", transfer: "Transfer" };

export default async function OrdersPage() {
  const { supabase } = await requireOwnerPage();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, cashier:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Sales ledger</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-950">Riwayat Pesanan</h1>
        <p className="mt-1 text-sm text-zinc-500">{orders?.length || 0} transaksi terakhir</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ReceiptText className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-zinc-950">Transaksi Terekam</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/70">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">No. Order</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Tanggal</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Kasir</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Total</th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Metode</th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders && orders.length > 0 ? orders.map((order) => (
              <tr key={order.id} className="hover:bg-zinc-50/60 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs font-semibold text-emerald-700">{order.order_number}</td>
                <td className="px-5 py-3.5 text-zinc-500 text-xs">{formatDateTime(order.created_at)}</td>
                <td className="px-5 py-3.5 text-zinc-700 text-xs">{order.cashier?.full_name || <span className="text-zinc-300">—</span>}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-zinc-900 tabular">{formatRupiah(order.total_amount)}</td>
                <td className="px-5 py-3.5 text-center">
                  <Badge variant="info">{methodLabel[order.payment_method] || order.payment_method}</Badge>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <Badge variant={order.status === "completed" ? "success" : "danger"}>
                    {order.status === "completed" ? "Selesai" : "Batal"}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <Link href={`/orders/${order.id}`} className="text-xs font-bold text-emerald-700 transition-colors hover:text-emerald-900">
                    Lihat
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100">
                      <ClipboardList className="h-5 w-5 text-zinc-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-400">Belum ada transaksi</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
