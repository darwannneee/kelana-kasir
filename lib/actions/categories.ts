"use server";
import { requireOwnerAction } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  if (!name) return { error: "Nama kategori tidak boleh kosong." };

  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  const { supabase } = auth;
  const { data: category, error } = await supabase.from("categories").insert({ name }).select().single();
  if (error) {
    if (error.code === "23505") return { error: "Kategori dengan nama ini sudah ada." };
    return { error: error.message };
  }

  revalidatePath("/categories");
  revalidatePath("/products");
  return { category };
}

export async function updateCategory(id: string, formData: FormData) {
  const name = (formData.get("name") as string).trim();
  if (!name) return { error: "Nama kategori tidak boleh kosong." };

  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  const { supabase } = auth;
  const { error } = await supabase.from("categories").update({ name }).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "Nama kategori sudah digunakan." };
    return { error: error.message };
  }

  revalidatePath("/categories");
  revalidatePath("/products");
}

export async function deleteCategory(id: string) {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  const { supabase } = auth;
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/categories");
  revalidatePath("/products");
}
