import { requireOwnerPage } from "@/lib/auth/guards";
import { deleteProduct } from "@/lib/actions/products";
import { formatRupiah } from "@/lib/utils";
import { Plus, Pencil, Trash2, Package, Boxes } from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

export default async function ProductsPage() {
  const { supabase } = await requireOwnerPage();
  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Inventory</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-950">Produk</h1>
          <p className="mt-1 text-sm text-zinc-500">{products?.length || 0} produk terdaftar</p>
        </div>
        <Link href="/products/new">
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#11120f] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-zinc-950/10 transition hover:bg-zinc-800">
            <Plus className="h-4 w-4" /> Tambah Produk
          </button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Boxes className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-zinc-950">Katalog Produk</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/70">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Produk</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Kategori</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Harga Jual</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Stok</th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products && products.length > 0 ? products.map((product) => (
              <tr key={product.id} className="hover:bg-zinc-50/60 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-zinc-950">{product.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-zinc-500 text-xs">{product.category?.name || <span className="text-zinc-300">—</span>}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-zinc-900 tabular">{formatRupiah(product.price)}</td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`text-sm font-semibold tabular ${product.stock < 5 ? "text-rose-500" : "text-zinc-700"}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <Badge variant={product.is_active ? "success" : "gray"}>
                    {product.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    <Link href={`/products/${product.id}/edit`}>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </Link>
                    <form action={async () => { "use server"; await deleteProduct(product.id); }}>
                      <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100">
                      <Package className="h-5 w-5 text-zinc-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-400">Belum ada produk.</p>
                    <Link href="/products/new" className="text-xs font-semibold text-emerald-700 hover:underline">Tambah produk pertama</Link>
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
