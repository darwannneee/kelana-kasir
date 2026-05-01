import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/lib/types/database";

export async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile: (data ?? null) as Profile | null };
}

type SessionContext = Awaited<ReturnType<typeof getSessionContext>>;
type ActiveSessionContext = SessionContext & {
  user: NonNullable<SessionContext["user"]>;
  profile: Profile;
};

export async function requireActiveProfile(): Promise<ActiveSessionContext> {
  const context = await getSessionContext();

  if (!context.user) {
    redirect("/login");
  }

  if (!context.profile || !context.profile.is_active) {
    await context.supabase.auth.signOut();
    redirect("/login");
  }

  return context as ActiveSessionContext;
}

export async function requireOwnerPage() {
  const context = await requireActiveProfile();

  if (context.profile.role !== "owner") {
    redirect("/kasir");
  }

  return context;
}

export async function requireActiveAction() {
  const context = await getSessionContext();

  if (!context.user) {
    return { ...context, error: "Sesi berakhir. Silakan login ulang." };
  }

  if (!context.profile || !context.profile.is_active) {
    await context.supabase.auth.signOut();
    return { ...context, error: "Akun tidak aktif. Hubungi owner." };
  }

  return { ...context, error: null };
}

export async function requireOwnerAction() {
  const context = await requireActiveAction();

  if (context.error) {
    return context;
  }

  if (context.profile?.role !== "owner") {
    return { ...context, error: "Akses hanya untuk owner." };
  }

  return context;
}
