import Link from "next/link"
import type { ReactNode } from "react"

import { Wordmark } from "@/components/brand/wordmark"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PublicShellProps = {
  children: ReactNode
  className?: string
}

export function PublicShell({ children, className }: PublicShellProps) {
  return (
    <div className={cn("min-h-dvh", className)}>
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-12">
          <Wordmark />
          <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <Link href="/pricing">Pricing</Link>
            <Link href="/faq">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Start</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
        {children}
      </main>
    </div>
  )
}
