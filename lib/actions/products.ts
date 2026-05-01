"use server";
import { requireOwnerAction } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProduct(formData: FormData) {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  const { supabase } = auth;
  const name = formData.get("name") as string;
  const price = parseInt(formData.get("price") as string, 10);
  const stock = parseInt(formData.get("stock") as string, 10);
  const category_id = (formData.get("category_id") as string) || null;
  const is_active = formData.get("is_active") === "on";

  const { error } = await supabase.from("products").insert({
    name, price, stock, category_id, is_active,
  });

  if (error) return { error: error.message };

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  const { supabase } = auth;
  const name = formData.get("name") as string;
  const price = parseInt(formData.get("price") as string, 10);
  const stock = parseInt(formData.get("stock") as string, 10);
  const category_id = (formData.get("category_id") as string) || null;
  const is_active = formData.get("is_active") === "on";

  const { error } = await supabase
    .from("products")
    .update({ name, price, stock, category_id, is_active })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProduct(id: string) {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  const { supabase } = auth;
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/products");
}

export async function getCategories() {
  const auth = await requireOwnerAction();
  if (auth.error) return { data: [] };
  const { supabase } = auth;
  const { data } = await supabase.from("categories").select("*").order("name");
  return { data };
}
