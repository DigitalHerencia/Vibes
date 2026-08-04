"use client"

import { Button } from "@/components/ui/button"

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-dvh place-items-center px-6">
          <div className="max-w-xl space-y-5 border bg-card p-8">
            <p className="eyebrow text-primary">Error</p>
            <h1>Something failed.</h1>
            <p className="text-muted-foreground">
              The app can retry this render without changing state.
            </p>
            <Button type="button" onClick={reset}>
              Retry
            </Button>
          </div>
        </main>
      </body>
    </html>
  )
}
