import { requireOwnerPage } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import SettingsClient from "./SettingsClient";
import { UserPlus, Users } from "lucide-react";

export default async function SettingsPage() {
  const { supabase, user } = await requireOwnerPage();
  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Workspace control</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-950">Pengaturan</h1>
        <p className="mt-1 text-sm text-zinc-500">Kelola akses owner dan kasir.</p>
      </div>

      <div className="mb-6 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-zinc-950">Daftar Pengguna</h2>
        </div>
        <div className="overflow-x-auto p-5">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="pb-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Nama</th>
              <th className="pb-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Role</th>
              <th className="pb-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Terdaftar</th>
              <th className="pb-3 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
              <th className="pb-3 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {(profiles || []).map((profile) => (
              <tr key={profile.id} className="hover:bg-zinc-50/60 transition-colors">
                <td className="py-3.5 font-semibold text-zinc-950">
                  {profile.full_name}
                  {profile.id === user.id && <span className="ml-2 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Kamu</span>}
                </td>
                <td className="py-3.5">
                  <Badge variant={profile.role === "owner" ? "info" : "gray"}>
                    {profile.role === "owner" ? "Owner" : "Kasir"}
                  </Badge>
                </td>
                <td className="py-3.5 text-zinc-500 text-xs">{formatDate(profile.created_at)}</td>
                <td className="py-3.5 text-center">
                  <Badge variant={profile.is_active ? "success" : "danger"}>
                    {profile.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </td>
                <td className="py-3.5 text-center">
                  <SettingsClient profile={profile} currentUserId={user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-950">Tambah Akun Baru</h2>
            <p className="mt-1 text-xs text-zinc-500">Buat akun kasir atau owner tambahan.</p>
          </div>
        </div>
        <AddKasirForm />
      </div>
    </div>
  );
}

function AddKasirForm() {
  return <SettingsClient />;
}
