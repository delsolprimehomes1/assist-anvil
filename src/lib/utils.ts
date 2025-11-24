import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function highlightText(text: string, query: string) {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (regex.test(part)) {
      regex.lastIndex = 0;
      return `<mark class="bg-primary/20 font-semibold">${part}</mark>`;
    }
    return part;
  }).join('');
}
