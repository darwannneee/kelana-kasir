"use server";
import { requireActiveAction } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export async function createOrder(
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    note?: string;
  }>,
  paymentMethod: string,
  paymentAmount: number,
  customerName?: string
) {
  const auth = await requireActiveAction();
  if (auth.error || !auth.user) return { error: auth.error ?? "Tidak terautentikasi" };
  const { supabase, user } = auth;

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const change = paymentAmount - total;
  const normalizedCustomerName = customerName?.trim() || "Umum";

  function getJakartaBusinessDay() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year")?.value ?? "0000";
    const month = parts.find((part) => part.type === "month")?.value ?? "00";
    const day = parts.find((part) => part.type === "day")?.value ?? "00";
    const date = `${year}-${month}-${day}`;

    return {
      token: `${year}${month}${day}`,
      start: `${date}T00:00:00+07:00`,
      end: `${date}T23:59:59.999+07:00`,
    };
  }

  const businessDay = getJakartaBusinessDay();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", businessDay.start)
    .lte("created_at", businessDay.end);

  let order = null;
  let lastError = "";

  for (let attempt = 0; attempt < 10; attempt++) {
    const sequence = (count ?? 0) + 1 + attempt;
    const orderNumber = `ORD-${businessDay.token}-${String(sequence).padStart(4, "0")}`;
    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        cashier_id: user.id,
        customer_name: normalizedCustomerName,
        total_amount: total,
        payment_method: paymentMethod,
        payment_amount: paymentAmount,
        change_amount: change,
        status: "completed",
      })
      .select()
      .single();

    if (!error && data) {
      order = data;
      break;
    }

    lastError = error?.message ?? "Gagal membuat pesanan";
    if (error?.code !== "23505") break;
  }

  if (!order) return { error: lastError || "Gagal membuat pesanan" };

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: item.quantity * item.unitPrice,
    note: item.note?.trim() || null,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) return { error: `Gagal menyimpan item pesanan: ${itemsError.message}` };

  for (const item of items) {
    await supabase.rpc("decrement_stock", {
      p_product_id: item.productId,
      p_quantity: item.quantity,
    });
  }

  revalidatePath("/orders");
  revalidatePath("/kasir");
  return { order };
}
