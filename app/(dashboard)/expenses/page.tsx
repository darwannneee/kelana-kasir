import { requireOwnerPage } from "@/lib/auth/guards";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage() {
  const { supabase } = await requireOwnerPage();
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  return <ExpensesClient initialExpenses={data || []} />;
}
