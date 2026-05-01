"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, KeyRound, Power, PowerOff, Trash2 } from "lucide-react";
import {
  changeAccountPassword,
  createKasir,
  deleteAccount,
  toggleKasirActive,
  updateAccountProfile,
} from "@/lib/actions/settings";
import type { Profile } from "@/lib/types/database";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface Props {
  profile?: Profile;
  currentUserId?: string;
}

export default function SettingsClient({ profile, currentUserId }: Props) {
  if (profile) {
    return <AccountActions profile={profile} isSelf={profile.id === currentUserId} />;
  }

  return <AddAccountForm />;
}

function AccountActions({ profile, isSelf }: { profile: Profile; isSelf: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  async function runAction(action: string, callback: () => Promise<{ error?: string; success?: boolean } | undefined>) {
    setLoading(action);
    setError("");
    setSuccess("");
    const result = await callback();

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("Berhasil disimpan.");
      router.refresh();
    }

    setLoading("");
    return result;
  }

  async function handleToggle() {
    await runAction("toggle", () => toggleKasirActive(profile.id, !profile.is_active));
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = await runAction("edit", () => updateAccountProfile(profile.id, new FormData(e.currentTarget)));
    if (!result?.error) setEditOpen(false);
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") || "");
    const confirmation = String(formData.get("password_confirmation") || "");

    if (password !== confirmation) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    const result = await runAction("password", () => changeAccountPassword(profile.id, formData));
    if (!result?.error) setPasswordOpen(false);
  }

  async function handleDelete() {
    const result = await runAction("delete", () => deleteAccount(profile.id));
    if (!result?.error) setDeleteOpen(false);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-1.5">
        {!isSelf && (
          <button
            type="button"
            onClick={handleToggle}
            disabled={loading === "toggle"}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors ${
              profile.is_active
                ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            } disabled:opacity-50`}
            title={profile.is_active ? "Nonaktifkan akun" : "Aktifkan akun"}
          >
            {profile.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
            {loading === "toggle" ? "..." : profile.is_active ? "Off" : "On"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setError("");
            setSuccess("");
            setEditOpen(true);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition hover:bg-emerald-50 hover:text-emerald-700"
          title="Edit akun"
          aria-label="Edit akun"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setError("");
            setSuccess("");
            setPasswordOpen(true);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition hover:bg-amber-50 hover:text-amber-700"
          title="Ganti password"
          aria-label="Ganti password"
        >
          <KeyRound className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setError("");
            setSuccess("");
            setDeleteOpen(true);
          }}
          disabled={isSelf}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-35"
          title={isSelf ? "Tidak bisa hapus akun sendiri" : "Hapus akun"}
          aria-label="Hapus akun"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="max-w-52 text-center text-[11px] font-medium leading-4 text-rose-600">{error}</p>}
      {success && <p className="text-[11px] font-semibold text-emerald-700">{success}</p>}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Akun" size="sm">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input label="Nama Lengkap" name="full_name" required defaultValue={profile.full_name} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Role</label>
              {isSelf && <input type="hidden" name="role" value={profile.role} />}
              <select
                name="role"
                defaultValue={profile.role}
                disabled={isSelf}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                <option value="kasir">Kasir</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <label className="flex items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              {isSelf && <input type="hidden" name="is_active" value="on" />}
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={profile.is_active}
                disabled={isSelf}
                className="mb-1 h-4 w-4 accent-emerald-600 disabled:opacity-40"
              />
              <span className="text-sm font-semibold text-zinc-700">Aktif</span>
            </label>
          </div>

          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => setEditOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button type="submit" loading={loading === "edit"} className="flex-1">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Ganti Password" size="sm">
        <form onSubmit={handlePassword} className="space-y-4">
          <Input label="Password Baru" name="password" type="password" required minLength={6} placeholder="Min. 6 karakter" />
          <Input label="Ulangi Password" name="password_confirmation" type="password" required minLength={6} placeholder="Ketik ulang password" />
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => setPasswordOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button type="submit" loading={loading === "password"} className="flex-1">
              Update
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Hapus Akun" size="sm">
        <div className="space-y-4">
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Akun <span className="font-bold">{profile.full_name}</span> akan dihapus dari Auth dan daftar pengguna.
          </div>
          {error && <div className="rounded-lg border border-rose-200 bg-white px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => setDeleteOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button variant="danger" type="button" loading={loading === "delete"} onClick={handleDelete} className="flex-1">
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AddAccountForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const result = await createKasir(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(result?.role === "owner" ? "Owner berhasil ditambahkan!" : "Kasir berhasil ditambahkan!");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Input label="Nama Lengkap" name="full_name" required placeholder="Nama lengkap" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" name="email" type="email" required placeholder="kasir@email.com" />
        <Input label="Password" name="password" type="password" required placeholder="Min. 6 karakter" minLength={6} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Role Akun</label>
        <select
          name="role"
          defaultValue="kasir"
          className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
        >
          <option value="kasir">Kasir</option>
          <option value="owner">Owner</option>
        </select>
      </div>
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
          {error.includes("service role") || error.includes("Service") ? (
            <p className="mt-1 text-xs text-rose-500">Tambahkan SUPABASE_SERVICE_ROLE_KEY di .env.local</p>
          ) : null}
        </div>
      )}
      {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}
      <Button type="submit" loading={loading}>
        Tambah Akun
      </Button>
    </form>
  );
}
