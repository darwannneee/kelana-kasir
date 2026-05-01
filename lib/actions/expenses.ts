"use server";
import { requireOwnerAction } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export async function createExpense(formData: FormData) {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  const { supabase } = auth;
  const title = formData.get("title") as string;
  const amount = parseInt(formData.get("amount") as string, 10);
  const category = formData.get("category") as string;
  const date = formData.get("date") as string;
  const note = (formData.get("note") as string) || null;

  const { error } = await supabase
    .from("expenses")
    .insert({ title, amount, category, date, note });

  if (error) return { error: error.message };

  revalidatePath("/expenses");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  const { supabase } = auth;
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/expenses");
}
