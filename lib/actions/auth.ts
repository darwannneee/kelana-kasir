"use server";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types/database";
import { redirect } from "next/navigation";

function normalizeRole(value: unknown): Role {
  return value === "owner" ? "owner" : "kasir";
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Email atau password salah. Coba cek lagi." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Login belum tersimpan. Silakan coba lagi." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  let activeProfile = profile;

  if (!activeProfile) {
    const metadata = user.user_metadata || {};
    const fullName =
      typeof metadata.full_name === "string" && metadata.full_name.trim()
        ? metadata.full_name.trim()
        : user.email?.split("@")[0] || "User";

    const { data: createdProfile, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        role: normalizeRole(metadata.role),
        is_active: true,
      })
      .select("role, is_active")
      .single();

    if (profileError || !createdProfile) {
      await supabase.auth.signOut();
      return { error: "Profil akun belum siap. Minta owner sinkronkan akun." };
    }

    activeProfile = createdProfile;
  }

  if (!activeProfile.is_active) {
    await supabase.auth.signOut();
    return { error: "Akun tidak aktif. Hubungi owner." };
  }

  redirect(activeProfile.role === "kasir" ? "/kasir" : "/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
