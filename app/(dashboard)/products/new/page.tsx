import { requireOwnerPage } from "@/lib/auth/guards";
import NewProductForm from "./NewProductForm";

export default async function NewProductPage() {
  const { supabase } = await requireOwnerPage();
  const { data: categories } = await supabase.from("categories").select("*").order("name");

  return <NewProductForm categories={categories || []} />;
}
