import type { ReactNode } from "react"

import { Wordmark } from "@/components/brand/wordmark"

type AuthShellProps = {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="grid min-h-dvh grid-cols-1 md:grid-cols-2">
      <section className="hidden border-r bg-background p-8 md:flex md:flex-col md:justify-between">
        <Wordmark />
        <div className="max-w-xl space-y-4">
          <p className="eyebrow text-sm text-primary">Server-owned auth boundary</p>
          <h1>Access stays accountable.</h1>
          <p className="text-muted-foreground">
            Clerk identifies the user. Local tables authorize row-level reads and writes.
          </p>
        </div>
      </section>
      <section className="flex min-h-dvh items-center justify-center px-6 py-12">
        {children}
      </section>
    </main>
  )
}
