import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeHref(href: string): string {
  if (href.startsWith("#") || (href.startsWith("/") && !href.startsWith("//"))) return href

  const url = new URL(href)
  if (url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:") {
    return href
  }

  throw new TypeError(`Unsupported URL protocol: ${url.protocol}`)
}
