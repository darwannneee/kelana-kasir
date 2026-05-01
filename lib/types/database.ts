export type Role = "owner" | "kasir";
export type PaymentMethod = "cash" | "qris" | "transfer";
export type OrderStatus = "completed" | "cancelled";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  cost_price?: number;
  stock: number;
  category_id: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface Order {
  id: string;
  order_number: string;
  cashier_id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_amount: number;
  change_amount: number;
  status: OrderStatus;
  created_at: string;
  cashier?: Profile;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  note: string | null;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note: string | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  todayProfit: number;
  todayExpenses: number;
  topProducts: { name: string; total_sold: number; revenue: number }[];
  weeklyRevenue: { date: string; revenue: number }[];
}
