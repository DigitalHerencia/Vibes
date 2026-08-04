import { UserButton } from "@clerk/nextjs"
import { LayoutDashboard, Settings, SquareKanban } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Wordmark } from "@/components/brand/wordmark"
import { Button } from "@/components/ui/button"

type TenantShellProps = {
  children: ReactNode
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: SquareKanban },
  { href: "/settings", label: "Settings", icon: Settings },
] as const

export function TenantShell({ children }: TenantShellProps) {
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-12">
          <Wordmark />
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Button key={item.href} asChild variant="ghost" size="sm">
                <Link href={item.href}>
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
          <UserButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t bg-background md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-muted-foreground no-underline"
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
