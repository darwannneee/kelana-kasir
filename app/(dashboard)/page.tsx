import { requireOwnerPage } from "@/lib/auth/guards";
import { formatRupiah } from "@/lib/utils";
import { TrendingUp, ShoppingBag, DollarSign, ArrowDownCircle } from "lucide-react";
import RevenueChart from "@/components/charts/RevenueChart";

export default async function DashboardPage() {
  const { supabase } = await requireOwnerPage();
  const today = new Date().toISOString().slice(0, 10);

  const { data: todayOrders } = await supabase
    .from("orders")
    .select("total_amount")
    .gte("created_at", today + "T00:00:00")
    .lte("created_at", today + "T23:59:59")
    .eq("status", "completed");

  const todayRevenue = (todayOrders || []).reduce((s, o) => s + o.total_amount, 0);
  const todayOrderCount = (todayOrders || []).length;

  const { data: todayExpenses } = await supabase
    .from("expenses")
    .select("amount")
    .eq("date", today);
  const todayExpenseTotal = (todayExpenses || []).reduce((s, e) => s + e.amount, 0);

  const todayProfit = todayRevenue - todayExpenseTotal;

  const days: { date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const { data: dayOrders } = await supabase
      .from("orders")
      .select("total_amount")
      .gte("created_at", dateStr + "T00:00:00")
      .lte("created_at", dateStr + "T23:59:59")
      .eq("status", "completed");
    days.push({ date: dateStr, revenue: (dayOrders || []).reduce((s, o) => s + o.total_amount, 0) });
  }

  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data: monthOrders } = await supabase
    .from("orders")
    .select("order_items(product_name, quantity, subtotal)")
    .gte("created_at", firstDay)
    .eq("status", "completed");

  const productMap: Record<string, { qty: number; revenue: number }> = {};
  for (const order of monthOrders || []) {
    for (const item of order.order_items || []) {
      if (!productMap[item.product_name]) productMap[item.product_name] = { qty: 0, revenue: 0 };
      productMap[item.product_name].qty += item.quantity;
      productMap[item.product_name].revenue += item.subtotal;
    }
  }
  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)
    .map(([name, d]) => ({ name, total_sold: d.qty, revenue: d.revenue }));

  const stats = [
    {
      label: "Omzet Hari Ini",
      value: formatRupiah(todayRevenue),
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
    },
    {
      label: "Transaksi",
      value: `${todayOrderCount} order`,
      icon: ShoppingBag,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-700",
    },
    {
      label: "Laba Bersih",
      value: formatRupiah(Math.max(0, todayProfit)),
      icon: DollarSign,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
    },
    {
      label: "Pengeluaran",
      value: formatRupiah(todayExpenseTotal),
      icon: ArrowDownCircle,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
    },
  ];

  const dateLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Owner cockpit</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-950">Dashboard</h1>
          <p className="mt-1 text-sm capitalize text-zinc-500">{dateLabel}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
          <span className="font-semibold text-zinc-950">Laba hari ini</span>
          <span className="tabular ml-3 font-bold text-emerald-700">{formatRupiah(Math.max(0, todayProfit))}</span>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{s.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.iconBg}`}>
                <s.icon className={`h-4 w-4 ${s.iconColor}`} />
              </div>
            </div>
            <p className="tabular text-xl font-bold text-zinc-950">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-950">Omzet 7 Hari Terakhir</h2>
              <p className="mt-1 text-xs text-zinc-500">Total pendapatan harian dari transaksi selesai.</p>
            </div>
          </div>
          <RevenueChart data={days} />
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-950">Produk Terlaris</h2>
              <p className="mt-1 text-xs text-zinc-500">Bulan ini</p>
            </div>
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-500">Top 5</span>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100">
                <ShoppingBag className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-400">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2.5">
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                      i === 0 ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-950">{p.name}</p>
                    <p className="text-xs text-zinc-500">{p.total_sold} terjual</p>
                  </div>
                  <p className="tabular flex-shrink-0 text-sm font-bold text-emerald-700">
                    {formatRupiah(p.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
