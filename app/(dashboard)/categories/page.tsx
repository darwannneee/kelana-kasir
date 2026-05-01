import { requireOwnerPage } from "@/lib/auth/guards";
import CategoriesClient from "./CategoriesClient";

export default async function CategoriesPage() {
  const { supabase } = await requireOwnerPage();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return <CategoriesClient initialCategories={categories || []} />;
}
