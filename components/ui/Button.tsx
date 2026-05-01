"use client";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses = {
  primary: "bg-[#11120f] hover:bg-zinc-800 active:bg-black text-white shadow-sm shadow-zinc-950/10",
  secondary: "bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 shadow-sm",
  danger: "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm",
  ghost: "hover:bg-zinc-100 text-zinc-700",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15",
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
      {...props}
    >
      {loading && (
        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {loading ? "Memuat..." : children}
    </button>
  );
}
