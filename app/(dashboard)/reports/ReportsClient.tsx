"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
import RevenueChart from "@/components/charts/RevenueChart";
import { BarChart2, CalendarDays, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";

export default function ReportsClient() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = now.toISOString().slice(0, 10);

  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);
  const [stats, setStats] = useState({ revenue: 0, profit: 0, orders: 0, avg: 0 });
  const [chartData, setChartData] = useState<{ date: string; revenue: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; total_sold: number; revenue: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: orders } = await supabase
      .from("orders")
      .select("total_amount, created_at, order_items(product_name, quantity, subtotal)")
      .gte("created_at", from + "T00:00:00")
      .lte("created_at", to + "T23:59:59")
      .eq("status", "completed");

    const totalRevenue = (orders || []).reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = (orders || []).length;
    const avg = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const dayMap: Record<string, number> = {};
    for (const order of orders || []) {
      const day = order.created_at.slice(0, 10);
      dayMap[day] = (dayMap[day] || 0) + order.total_amount;
    }

    const days: { date: string; revenue: number }[] = [];
    const start = new Date(from);
    const end = new Date(to);
    for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      const date = day.toISOString().slice(0, 10);
      days.push({ date, revenue: dayMap[date] || 0 });
    }

    const productMap: Record<string, { qty: number; revenue: number }> = {};
    for (const order of orders || []) {
      for (const item of order.order_items || []) {
        if (!productMap[item.product_name]) productMap[item.product_name] = { qty: 0, revenue: 0 };
        productMap[item.product_name].qty += item.quantity;
        productMap[item.product_name].revenue += item.subtotal;
      }
    }
    const top = Object.entries(productMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([name, data]) => ({ name, total_sold: data.qty, revenue: data.revenue }));

    const { data: expenses } = await supabase.from("expenses").select("amount").gte("date", from).lte("date", to);
    const totalExpenses = (expenses || []).reduce((sum, expense) => sum + expense.amount, 0);

    setStats({ revenue: totalRevenue, profit: totalRevenue - totalExpenses, orders: totalOrders, avg });
    setChartData(days);
    setTopProducts(top);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport();
  }, [loadReport]);

  const statCards = [
    { label: "Total Omzet", value: formatRupiah(stats.revenue), icon: TrendingUp, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Laba Bersih", value: formatRupiah(Math.max(0, stats.profit)), icon: DollarSign, tone: "bg-sky-50 text-sky-700" },
    { label: "Transaksi", value: `${stats.orders} order`, icon: ShoppingBag, tone: "bg-amber-50 text-amber-700" },
    { label: "Rata-rata", value: formatRupiah(stats.avg), icon: BarChart2, tone: "bg-zinc-100 text-zinc-700" },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Business intelligence</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">Laporan</h1>
          <p className="mt-1 text-sm text-zinc-500">Pantau omzet, transaksi, dan produk yang paling menggerakkan kas.</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center">
          <CalendarDays className="hidden h-4 w-4 text-zinc-400 sm:block" />
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Dari
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Sampai
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>
          {loading && <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{card.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="tabular text-xl font-bold tracking-tight text-zinc-950">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-zinc-950">Omzet per Hari</h2>
            <p className="mt-1 text-xs text-zinc-500">Data mengikuti rentang tanggal yang dipilih.</p>
          </div>
          <RevenueChart data={chartData} />
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-950">Produk Terlaris</h2>
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-500">Top 10</span>
          </div>
          {topProducts.length === 0 ? (
            <p className="py-10 text-center text-sm font-medium text-zinc-400">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2.5">
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold ${index === 0 ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-500"}`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-950">{product.name}</p>
                    <p className="text-xs text-zinc-500">{product.total_sold} terjual</p>
                  </div>
                  <p className="tabular text-sm font-bold text-emerald-700">{formatRupiah(product.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
