"use client";
import { useState, useTransition } from "react";
import { login } from "@/lib/actions/auth";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Store,
  WalletCards,
} from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-[#11120f] px-12 py-10 text-white lg:flex lg:flex-col">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/0 via-emerald-300/60 to-amber-200/0" />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-950/40">
              <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold leading-none tracking-tight">KasirKelana</p>
              <p className="mt-1 text-xs text-zinc-400">Premium POS Workspace</p>
            </div>
          </div>

          <div className="flex flex-1 items-center">
            <div className="max-w-xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                Siap untuk transaksi cepat, stok rapi, dan laporan real-time.
              </div>
              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight">
                Operasional toko terasa seperti POS premium.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-zinc-400">
                Kasir fokus melayani pelanggan, owner memantau performa, produk, dan pengeluaran dari satu layar kerja yang tenang.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-3">
                {[
                  { icon: ReceiptText, label: "Transaksi", value: "Cepat" },
                  { icon: Store, label: "Inventori", value: "Terkontrol" },
                  { icon: WalletCards, label: "Laporan", value: "Jelas" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <item.icon className="mb-4 h-5 w-5 text-amber-200" />
                    <p className="text-xs text-zinc-500">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] items-end gap-8">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-400">Live checkout</p>
                <span className="rounded-md bg-emerald-400/15 px-2 py-1 text-[11px] font-semibold text-emerald-200">
                  Online
                </span>
              </div>
              <div className="space-y-3">
                {["Kopi Susu Aren", "Roti Bakar", "Es Teh Manis"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm text-zinc-200">{item}</p>
                    </div>
                    <p className="text-sm font-semibold text-white">Rp {(18 + index * 6).toLocaleString("id-ID")}.000</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="pb-1 text-right text-xs leading-5 text-zinc-500">
              Dibuat untuk UMKM yang butuh alur kerja kasir yang gesit.
            </p>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#11120f] text-emerald-300">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-zinc-950">KasirKelana</h1>
                <p className="text-xs text-zinc-500">Premium POS Workspace</p>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="mb-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Masuk ke workspace</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Owner masuk ke dashboard, kasir langsung diarahkan ke layar POS.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="nama@email.com"
                    className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 text-sm font-medium text-zinc-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="Masukkan password"
                      className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 pr-12 text-sm font-medium text-zinc-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                      tabIndex={-1}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#11120f] px-4 text-sm font-bold text-white shadow-lg shadow-zinc-950/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <>
                      Masuk
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-500">
              © {new Date().getFullYear()} KasirKelana. Sistem kasir untuk operasional harian.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
