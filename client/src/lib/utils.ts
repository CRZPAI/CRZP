import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskColor(score: number): string {
  if (score <= 25) return "hsl(var(--risk-safe))";
  if (score <= 50) return "hsl(var(--risk-moderate))";
  if (score <= 75) return "hsl(var(--risk-high))";
  return "hsl(var(--risk-extreme))";
}

export function getRiskColorClass(score: number, type: 'text' | 'bg' | 'border' = 'text'): string {
  if (score <= 25) return type === 'text' ? "text-[#10b981]" : type === 'bg' ? "bg-[#10b981]" : "border-[#10b981]";
  if (score <= 50) return type === 'text' ? "text-[#f59e0b]" : type === 'bg' ? "bg-[#f59e0b]" : "border-[#f59e0b]";
  if (score <= 75) return type === 'text' ? "text-[#f97316]" : type === 'bg' ? "bg-[#f97316]" : "border-[#f97316]";
  return type === 'text' ? "text-[#e11d48]" : type === 'bg' ? "bg-[#e11d48]" : "border-[#e11d48]";
}
