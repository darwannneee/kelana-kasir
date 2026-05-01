"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { createProduct } from "@/lib/actions/products";
import { Category } from "@/lib/types/database";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function NewProductForm({ categories }: { categories: Category[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createProduct(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/products");
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/products"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:text-zinc-950"
          aria-label="Kembali ke produk"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Tambah Produk</h1>
          <p className="mt-1 text-sm text-zinc-500">Siapkan produk baru untuk layar kasir.</p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <PackagePlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-950">Informasi Produk</p>
            <p className="text-xs text-zinc-500">Harga, stok, kategori, dan status tampil.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Nama Produk" name="name" required placeholder="Contoh: Nasi Goreng" />

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Kategori
            </label>
            <select
              name="category_id"
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="">Tanpa Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Harga Jual (Rp)" name="price" type="number" required min="0" placeholder="0" />
            <Input label="Stok Awal" name="stock" type="number" required min="0" placeholder="0" />
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-3">
            <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4 accent-emerald-600" />
            <span className="text-sm font-semibold text-zinc-800">Produk aktif dan tampil di kasir</span>
          </label>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link href="/products" className="flex-1">
              <Button variant="secondary" className="w-full" type="button">
                Batal
              </Button>
            </Link>
            <Button type="submit" loading={loading} className="flex-1">
              Simpan Produk
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
