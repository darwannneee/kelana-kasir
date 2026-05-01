import { requireOwnerPage } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import EditProductForm from "./EditProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireOwnerPage();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("categories").select("*").order("name"),
  ]);

  if (!product) notFound();

  return <EditProductForm product={product} categories={categories || []} />;
}
