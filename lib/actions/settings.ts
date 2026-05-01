"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwnerAction } from "@/lib/auth/guards";
import type { Role } from "@/lib/types/database";
import { revalidatePath } from "next/cache";

function normalizeRole(value: FormDataEntryValue | null): Role {
  return value === "owner" ? "owner" : "kasir";
}

async function getTargetProfile(supabase: Awaited<ReturnType<typeof requireOwnerAction>>["supabase"], id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", id)
    .single();

  if (error || !data) {
    return { error: "Profil akun tidak ditemukan.", profile: null };
  }

  return { error: null, profile: data };
}

async function hasOtherActiveOwner(
  supabase: Awaited<ReturnType<typeof requireOwnerAction>>["supabase"],
  id: string
) {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner")
    .eq("is_active", true)
    .neq("id", id);

  if (error) return { error: error.message, ok: false };

  return { error: null, ok: (count ?? 0) > 0 };
}

async function assertCanRemoveActiveOwner(
  supabase: Awaited<ReturnType<typeof requireOwnerAction>>["supabase"],
  id: string,
  message: string
) {
  const { error, ok } = await hasOtherActiveOwner(supabase, id);
  if (error) return error;
  if (!ok) return message;
  return null;
}

export async function createKasir(formData: FormData) {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const full_name = String(formData.get("full_name") || "").trim();
  const role = normalizeRole(formData.get("role"));

  if (!email || !password || !full_name) {
    return { error: "Nama, email, dan password wajib diisi." };
  }

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: "Akun auth berhasil dibuat, tapi user id tidak diterima." };

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: data.user.id,
      full_name,
      role,
      is_active: true,
    });

    if (profileError) return { error: profileError.message };

    revalidatePath("/settings");
    return { success: true, role };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Service role key tidak dikonfigurasi.",
    };
  }
}

export async function toggleKasirActive(id: string, isActive: boolean) {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  if (user?.id === id) {
    return { error: "Akun yang sedang dipakai tidak bisa dinonaktifkan dari sini." };
  }

  const { profile: targetProfile, error: targetError } = await getTargetProfile(supabase, id);
  if (targetError || !targetProfile) return { error: targetError };

  if (targetProfile.role === "owner" && !isActive) {
    const ownerError = await assertCanRemoveActiveOwner(
      supabase,
      id,
      "Minimal harus ada satu owner aktif."
    );
    if (ownerError) return { error: ownerError };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function updateAccountProfile(id: string, formData: FormData) {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  const full_name = String(formData.get("full_name") || "").trim();
  const nextRole = normalizeRole(formData.get("role"));
  const nextIsActive = formData.get("is_active") === "on";

  if (!full_name) return { error: "Nama lengkap wajib diisi." };

  const { profile: targetProfile, error: targetError } = await getTargetProfile(supabase, id);
  if (targetError || !targetProfile) return { error: targetError };

  if (user?.id === id && (nextRole !== "owner" || !nextIsActive)) {
    return { error: "Akun yang sedang dipakai harus tetap owner aktif." };
  }

  const removingActiveOwner =
    targetProfile.role === "owner" &&
    targetProfile.is_active &&
    (nextRole !== "owner" || !nextIsActive);

  if (removingActiveOwner) {
    const ownerError = await assertCanRemoveActiveOwner(
      supabase,
      id,
      "Minimal harus ada satu owner aktif sebelum role/status akun ini diubah."
    );
    if (ownerError) return { error: ownerError };
  }

  try {
    const adminClient = createAdminClient();
    const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
      user_metadata: { full_name, role: nextRole },
    });

    if (authError) return { error: authError.message };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Service role key tidak dikonfigurasi.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, role: nextRole, is_active: nextIsActive })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function changeAccountPassword(id: string, formData: FormData) {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };

  const password = String(formData.get("password") || "");
  if (password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.updateUserById(id, { password });
    if (error) return { error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Service role key tidak dikonfigurasi.",
    };
  }
}

export async function deleteAccount(id: string) {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  if (user?.id === id) {
    return { error: "Akun yang sedang dipakai tidak bisa dihapus." };
  }

  const { profile: targetProfile, error: targetError } = await getTargetProfile(supabase, id);
  if (targetError || !targetProfile) return { error: targetError };

  if (targetProfile.role === "owner" && targetProfile.is_active) {
    const ownerError = await assertCanRemoveActiveOwner(
      supabase,
      id,
      "Minimal harus ada satu owner aktif sebelum akun ini dihapus."
    );
    if (ownerError) return { error: ownerError };
  }

  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.deleteUser(id);
    if (error) return { error: error.message };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Service role key tidak dikonfigurasi.",
    };
  }

  await supabase.from("profiles").delete().eq("id", id);

  revalidatePath("/settings");
  return { success: true };
}
