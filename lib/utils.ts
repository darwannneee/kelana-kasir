export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatRupiah(amount: number): string {
  return "Rp " + amount.toLocaleString("id-ID");
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
