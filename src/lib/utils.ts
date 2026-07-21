import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Locale-aware, case/accent-insensitive comparator for sorting names in pt-BR. */
export function compareNames(a: string, b: string): number {
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}
