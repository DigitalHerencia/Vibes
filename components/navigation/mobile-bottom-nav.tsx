"use client"

import { FileText, HelpCircle, Home, ShieldCheck, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export interface MobileBottomNavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface MobileBottomNavProps {
  items: readonly MobileBottomNavItem[]
  "aria-label"?: string
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MobileBottomNav({
  items,
  "aria-label": ariaLabel = "Mobile navigation",
}: MobileBottomNavProps) {
  const pathname = usePathname()
  return (
    <nav
      aria-label={ariaLabel}
      className="fixed inset-x-0 bottom-0 z-50 grid h-14 grid-cols-4 border-t border-neutral-400 bg-black md:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
            className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-neutral-400 uppercase aria-[current=page]:text-white"
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

const publicItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/pricing", label: "Price", icon: FileText },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/sign-in", label: "Sign", icon: ShieldCheck },
] satisfies readonly MobileBottomNavItem[]

export function PublicMobileBottomNav() {
  return <MobileBottomNav items={publicItems} aria-label="Public mobile navigation" />
}
