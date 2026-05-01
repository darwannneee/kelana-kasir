"use client";
import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-950 placeholder:text-zinc-400",
          "focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all",
          error && "border-red-400 focus:ring-red-500/20 focus:border-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
