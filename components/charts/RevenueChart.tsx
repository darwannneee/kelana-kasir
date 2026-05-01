"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
}

function formatTooltip(value: number): string {
  return "Rp " + value.toLocaleString("id-ID");
}

function formatXDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatXDate(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ece7dc" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          formatter={(value) => [formatTooltip(Number(value ?? 0)), "Omzet"]}
          labelStyle={{ color: "#18181b", fontWeight: 600 }}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e4e4e7", boxShadow: "0 10px 30px rgba(15,23,42,0.08)" }}
          cursor={{ fill: "rgba(16,185,129,0.08)" }}
        />
        <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
