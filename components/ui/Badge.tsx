import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "gray";
  children: ReactNode;
}

const variantClasses = {
  success: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200/70 bg-amber-50 text-amber-700",
  danger: "border-rose-200/70 bg-rose-50 text-rose-700",
  info: "border-sky-200/70 bg-sky-50 text-sky-700",
  gray: "border-zinc-200/70 bg-zinc-100 text-zinc-600",
};

export default function Badge({ variant = "gray", children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        variantClasses[variant]
      )}
    >
      {children}
    </span>
  );
}
