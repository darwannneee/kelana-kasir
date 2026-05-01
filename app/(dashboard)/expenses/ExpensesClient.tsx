"use client";
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { createExpense, deleteExpense } from "@/lib/actions/expenses";
import { Expense } from "@/lib/types/database";
import { formatRupiah, formatDate } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Plus, ReceiptText, Trash2, Wallet } from "lucide-react";

const expenseCategories = ["Bahan Baku", "Operasional", "Gaji", "Transportasi", "Lainnya"];

export default function ExpensesClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadExpenses = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    setExpenses(data || []);
  }, []);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = expenses
    .filter((expense) => expense.date.startsWith(thisMonth))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const totalAll = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createExpense(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
    } else {
      setModalOpen(false);
      await loadExpenses();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pengeluaran ini?")) return;
    await deleteExpense(id);
    await loadExpenses();
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Cashflow</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">Pengeluaran</h1>
          <p className="mt-1 text-sm text-zinc-500">Catat biaya operasional agar laba tetap terbaca jelas.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Tambah Pengeluaran
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {[
          { label: "Bulan Ini", value: formatRupiah(thisMonthTotal), icon: Wallet, tone: "text-rose-600 bg-rose-50" },
          { label: "Total Semua", value: formatRupiah(totalAll), icon: ReceiptText, tone: "text-amber-700 bg-amber-50" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{item.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.tone}`}>
                <item.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="tabular text-2xl font-bold tracking-tight text-zinc-950">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-bold text-zinc-950">Daftar Pengeluaran</h2>
          <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
            {expenses.length} data
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Keterangan</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Kategori</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Tanggal</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Jumlah</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <tr key={expense.id} className="transition-colors hover:bg-zinc-50/70">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-zinc-950">{expense.title}</p>
                      {expense.note && <p className="mt-0.5 text-xs text-zinc-500">{expense.note}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-zinc-600">{expense.category}</td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500">{formatDate(expense.date)}</td>
                    <td className="tabular px-5 py-3.5 text-right font-bold text-rose-600">
                      {formatRupiah(expense.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Hapus pengeluaran"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100">
                      <Wallet className="h-5 w-5 text-zinc-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500">Belum ada pengeluaran dicatat</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Pengeluaran" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Keterangan" name="title" required placeholder="Contoh: Beli bahan baku" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Jumlah (Rp)" name="amount" type="number" required min="1" placeholder="0" />
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Kategori</label>
              <select
                name="category"
                required
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Input label="Tanggal" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          <Input label="Catatan (opsional)" name="note" placeholder="Keterangan tambahan..." />
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
