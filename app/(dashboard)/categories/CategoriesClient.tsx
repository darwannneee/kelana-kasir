"use client";
import { useState, useTransition } from "react";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/categories";
import { Category } from "@/lib/types/database";
import { Plus, Pencil, Trash2, Tag, Check, X } from "lucide-react";

export default function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    const fd = new FormData();
    fd.set("name", newName);
    const result = await createCategory(fd);
    if (result?.error) {
      setAddError(result.error);
    } else {
      setNewName("");
      if (result?.category) {
        setCategories((prev) => [...prev, result.category]);
      }
    }
  }

  async function handleUpdate(id: string) {
    setEditError("");
    const fd = new FormData();
    fd.set("name", editName);
    const result = await updateCategory(id, fd);
    if (result?.error) {
      setEditError(result.error);
    } else {
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: editName } : c)));
      setEditId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus kategori "${name}"? Produk yang menggunakan kategori ini akan menjadi tanpa kategori.`)) return;
    startTransition(async () => {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    });
  }

  function startEdit(cat: Category) {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditError("");
  }

  return (
    <div className="max-w-3xl p-4 md:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Inventory</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-950">Kategori Produk</h1>
        <p className="mt-1 text-sm text-zinc-500">Kelola kategori supaya produk mudah dicari di layar kasir.</p>
      </div>

      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-zinc-500">Tambah Kategori Baru</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              placeholder="Contoh: Makanan, Minuman, Snack..."
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
            {addError && <p className="mt-1.5 text-xs font-medium text-rose-600">{addError}</p>}
          </div>
          <button
            type="submit"
            disabled={!newName.trim()}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-[#11120f] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-zinc-950/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Daftar Kategori</h2>
          <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-500">{categories.length} kategori</span>
        </div>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100">
              <Tag className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-500">Belum ada kategori</p>
            <p className="mt-1 text-xs text-zinc-400">Tambahkan kategori pertama di atas</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-zinc-50/60 transition-colors">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Tag className="h-4 w-4" />
                </div>

                {editId === cat.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="h-9 flex-1 rounded-lg border border-emerald-500 px-3 text-sm font-medium outline-none focus:ring-4 focus:ring-emerald-500/10"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(cat.id);
                        if (e.key === "Escape") setEditId(null);
                      }}
                    />
                    {editError && <p className="text-xs font-medium text-rose-600">{editError}</p>}
                    <button onClick={() => handleUpdate(cat.id)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-semibold text-zinc-950">{cat.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
