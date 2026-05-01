"use client";
import { formatDate } from "@/lib/utils";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const today = formatDate(new Date().toISOString());

  return (
    <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
      <h1 className="text-xl font-bold text-zinc-950">{title}</h1>
      <p className="text-sm font-medium text-zinc-500">{today}</p>
    </div>
  );
}
