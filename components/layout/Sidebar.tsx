"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  BarChart2,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  Wallet,
} from "lucide-react";
import { Profile } from "@/lib/types/database";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  profile: Profile;
}

const allNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Kasir", icon: ShoppingCart, href: "/kasir" },
  { label: "Produk", icon: Package, href: "/products" },
  { label: "Kategori", icon: Tag, href: "/categories" },
  { label: "Pesanan", icon: ClipboardList, href: "/orders" },
  { label: "Pengeluaran", icon: Wallet, href: "/expenses" },
  { label: "Laporan", icon: BarChart2, href: "/reports" },
  { label: "Pengaturan", icon: Settings, href: "/settings" },
];

const kasirNavItems = [
  { label: "Kasir", icon: ShoppingCart, href: "/kasir" },
  { label: "Recent", icon: History, href: "/kasir/recent" },
];

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const navItems = profile.role === "kasir" ? kasirNavItems : allNavItems;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/kasir") return pathname === "/kasir";
    return pathname.startsWith(href);
  }

  const initials = profile.full_name
    .split(" ")
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-white/10 bg-[#11120f] text-white md:flex">
        <div className="px-5 pb-5 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-950/30">
              <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-none tracking-tight">KasirKelana</h1>
              <p className="mt-1 text-xs leading-none text-zinc-500">Premium POS Workspace</p>
            </div>
          </div>
        </div>

        <div className="mx-4 rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-amber-200" />
            <p className="text-xs font-semibold text-zinc-300">Mode operasional</p>
          </div>
          <p className="mt-2 text-lg font-bold tracking-tight">
            {profile.role === "owner" ? "Back Office" : "Kasir POS"}
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    active ? "text-emerald-700" : "text-zinc-600 group-hover:text-zinc-300"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-xs font-bold text-emerald-200">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-none text-white">{profile.full_name}</p>
                <div className="mt-1.5 flex items-center gap-1 text-xs capitalize text-zinc-500">
                  <BadgeCheck className="h-3 w-3 text-emerald-300" />
                  {profile.role === "owner" ? "Owner" : "Kasir"}
                </div>
              </div>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-zinc-200/80 bg-[#f4f1ea]/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#11120f] text-emerald-300">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-zinc-950">KasirKelana</p>
              <p className="mt-1 text-xs text-zinc-500">{profile.role === "owner" ? "Owner" : "Kasir"}</p>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500"
              aria-label="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[70px] flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition",
                  active ? "bg-[#11120f] text-white" : "text-zinc-500"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-emerald-300" : "text-zinc-400")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
